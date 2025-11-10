import { DataUnified } from './database';

export interface TreeNode {
  attribute?: string;
  gain_ratio?: number;
  branches?: Record<string, TreeNode | string>;
  threshold?: number;
  type?: 'node' | 'leaf' | 'categorical';
  label?: string;
}

export interface C45Config {
  minSamples: number;
  minGainRatio: number;
  targetAttribute: string;
  irrelevantAttributes: string[];
}

export interface C45Result {
  tree: TreeNode;
  accuracy: number;
  precision: number;
  recall: number;
  f1_score: number;
  confusionMatrix: {
    tp: number;
    fp: number;
    tn: number;
    fn: number;
  };
  rules: Array<{
    condition: string;
    result: string;
    confidence: number;
    support: number;
  }>;
}

export class C45Algorithm {
  private config: C45Config;

  constructor(config?: Partial<C45Config>) {
    this.config = {
      minSamples: 5,
      minGainRatio: 0.01,
      targetAttribute: 'status_stok',
      irrelevantAttributes: ['id', 'created_at', 'updated_at', 'type', 'split_type', 'split_percentage', 'is_processed'],
      ...config
    };
  }

  /**
   * Membangun pohon keputusan C4.5
   */
  buildTree(data: DataUnified[], targetAttribute: string = this.config.targetAttribute): TreeNode {
    // Validasi input
    if (!data || data.length === 0) {
      throw new Error('Data tidak boleh kosong');
    }

    if (!data[0] || typeof data[0] !== 'object') {
      throw new Error('Data harus berupa array of objects');
    }

    if (!(targetAttribute in data[0])) {
      throw new Error(`Target attribute '${targetAttribute}' tidak ditemukan dalam data`);
    }

    // Minimum samples criteria
    if (data.length < this.config.minSamples) {
      const classes = data.map(row => row[targetAttribute as keyof DataUnified] as string);
      return { type: 'leaf', label: this.getMajorityClass(classes) };
    }

    // Hitung entropy awal
    const entropy = this.calculateEntropy(data, targetAttribute);

    // Jika entropy = 0, semua data memiliki kelas yang sama
    if (entropy === 0) {
      const labels = data.map(row => row[targetAttribute as keyof DataUnified] as string);
      return { type: 'leaf', label: labels[0] };
    }

    // Hitung Gain Ratio untuk setiap atribut
    const attributes = Object.keys(data[0]).filter(
      attr => attr !== targetAttribute && !this.config.irrelevantAttributes.includes(attr)
    );

    if (attributes.length === 0) {
      throw new Error('Tidak ada atribut untuk split');
    }

    let bestAttribute: string | null = null;
    let maxGainRatio = 0;

    for (const attribute of attributes) {
      const gainRatio = this.calculateGainRatio(data, attribute, targetAttribute);
      if (gainRatio > maxGainRatio) {
        maxGainRatio = gainRatio;
        bestAttribute = attribute;
      }
    }

    // Minimum gain ratio threshold
    if (!bestAttribute || maxGainRatio < this.config.minGainRatio) {
      const labels = data.map(row => row[targetAttribute as keyof DataUnified] as string);
      return { type: 'leaf', label: this.getMajorityClass(labels) };
    }

    // Bangun pohon keputusan
    const tree: TreeNode = {
      type: 'categorical',
      attribute: bestAttribute,
      gain_ratio: maxGainRatio,
      branches: {}
    };

    // Kelompokkan data berdasarkan nilai atribut terbaik
    const groups = this.groupBy(data, bestAttribute);

    for (const [value, group] of Object.entries(groups)) {
      // Jika semua data dalam grup memiliki label yang sama, jadikan leaf
      const labels = group.map(row => row[targetAttribute as keyof DataUnified] as string);
      if (new Set(labels).size === 1) {
        tree.branches![value] = { type: 'leaf', label: labels[0] };
      } else {
        // Rekursif
        tree.branches![value] = this.buildTree(group, targetAttribute);
      }
    }

    return tree;
  }

  /**
   * Hitung entropy
   */
  calculateEntropy(data: DataUnified[], targetAttribute: string): number {
    if (!data || data.length === 0) {
      return 0;
    }

    const labels = data.map(row => row[targetAttribute as keyof DataUnified] as string);
    const counts: Record<string, number> = {};
    
    labels.forEach(label => {
      counts[label] = (counts[label] || 0) + 1;
    });

    const total = labels.length;
    let entropy = 0;

    for (const count of Object.values(counts)) {
      if (count > 0) {
        const p = count / total;
        entropy -= p * Math.log2(p);
      }
    }

    return entropy;
  }

  /**
   * Hitung Gain Ratio
   */
  calculateGainRatio(data: DataUnified[], attribute: string, targetAttribute: string): number {
    const entropyBefore = this.calculateEntropy(data, targetAttribute);
    const groups = this.groupBy(data, attribute);
    const total = data.length;
    
    let entropyAfter = 0;
    let splitInfo = 0;

    for (const group of Object.values(groups)) {
      const weight = group.length / total;
      entropyAfter += weight * this.calculateEntropy(group, targetAttribute);
      
      if (weight > 0) {
        splitInfo -= weight * Math.log2(weight);
      }
    }

    const informationGain = entropyBefore - entropyAfter;
    const gainRatio = splitInfo === 0 ? 0 : informationGain / splitInfo;

    return gainRatio;
  }

  /**
   * Kelompokkan data berdasarkan atribut
   */
  groupBy(data: DataUnified[], attribute: string): Record<string, DataUnified[]> {
    const groups: Record<string, DataUnified[]> = {};
    
    for (const row of data) {
      const key = String(row[attribute as keyof DataUnified]);
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(row);
    }
    
    return groups;
  }

  /**
   * Prediksi menggunakan pohon keputusan
   */
  predict(tree: TreeNode, data: Partial<DataUnified>): string {
    // Jika tree adalah leaf node
    if (tree.type === 'leaf') {
      return tree.label || 'Cukup';
    }

    // Jika tree tidak memiliki attribute atau branches
    if (!tree.attribute || !tree.branches) {
      return 'Cukup'; // Default prediction
    }

    const attribute = tree.attribute;
    const value = data[attribute as keyof DataUnified];

    if (value === null || value === undefined || !tree.branches[String(value)]) {
      return 'Cukup'; // Default prediction jika tidak bisa diprediksi
    }

    const next = tree.branches[String(value)];
    return this.predict(next, data);
  }

  /**
   * Evaluasi model dengan data test
   */
  evaluateModel(tree: TreeNode, testData: DataUnified[], targetAttribute: string = this.config.targetAttribute): {
    accuracy: number;
    precision: number;
    recall: number;
    f1_score: number;
    confusionMatrix: { tp: number; fp: number; tn: number; fn: number };
  } {
    const predictions = testData.map(row => this.predict(tree, row));
    const actuals = testData.map(row => row[targetAttribute as keyof DataUnified] as string);

    // Hitung confusion matrix
    let tp = 0, fp = 0, tn = 0, fn = 0;

    for (let i = 0; i < predictions.length; i++) {
      const actual = actuals[i];
      const predicted = predictions[i];

      if (actual === 'Berlebih' && predicted === 'Berlebih') tp++;
      else if (actual === 'Berlebih' && predicted !== 'Berlebih') fn++;
      else if (actual !== 'Berlebih' && predicted === 'Berlebih') fp++;
      else tn++;
    }

    const accuracy = (tp + tn) / (tp + fp + tn + fn);
    const precision = tp / (tp + fp) || 0;
    const recall = tp / (tp + fn) || 0;
    const f1_score = 2 * (precision * recall) / (precision + recall) || 0;

    return {
      accuracy,
      precision,
      recall,
      f1_score,
      confusionMatrix: { tp, fp, tn, fn }
    };
  }

  /**
   * Ekstrak rules dari pohon keputusan
   */
  extractRules(tree: TreeNode, path: string = ''): Array<{
    condition: string;
    result: string;
    confidence: number;
    support: number;
  }> {
    const rules: Array<{
      condition: string;
      result: string;
      confidence: number;
      support: number;
    }> = [];

    if (tree.type === 'leaf') {
      rules.push({
        condition: path || 'default',
        result: tree.label || 'Cukup',
        confidence: 1.0,
        support: 1.0
      });
    } else if (tree.branches) {
      for (const [value, branch] of Object.entries(tree.branches)) {
        const newPath = path ? `${path} AND ${tree.attribute} = ${value}` : `${tree.attribute} = ${value}`;
        rules.push(...this.extractRules(branch, newPath));
      }
    }

    return rules;
  }

  /**
   * Jalankan algoritma C4.5 lengkap
   */
  async runC45(trainingData: DataUnified[], testData: DataUnified[]): Promise<C45Result> {
    console.log('🚀 Memulai algoritma C4.5...');
    console.log(`📊 Data latih: ${trainingData.length} records`);
    console.log(`📊 Data uji: ${testData.length} records`);

    // Build tree
    console.log('🌳 Membangun pohon keputusan...');
    const tree = this.buildTree(trainingData);

    // Evaluate model
    console.log('📈 Mengevaluasi model...');
    const evaluation = this.evaluateModel(tree, testData);

    // Extract rules
    console.log('📋 Mengekstrak rules...');
    const rules = this.extractRules(tree);

    console.log('✅ Algoritma C4.5 selesai!');
    console.log(`🎯 Akurasi: ${(evaluation.accuracy * 100).toFixed(2)}%`);
    console.log(`🎯 Precision: ${(evaluation.precision * 100).toFixed(2)}%`);
    console.log(`🎯 Recall: ${(evaluation.recall * 100).toFixed(2)}%`);
    console.log(`🎯 F1-Score: ${(evaluation.f1_score * 100).toFixed(2)}%`);

    return {
      tree,
      accuracy: evaluation.accuracy,
      precision: evaluation.precision,
      recall: evaluation.recall,
      f1_score: evaluation.f1_score,
      confusionMatrix: evaluation.confusionMatrix,
      rules
    };
  }

  /**
   * Get majority class dari array of classes
   */
  private getMajorityClass(classes: string[]): string {
    const counts: Record<string, number> = {};
    classes.forEach(cls => {
      counts[cls] = (counts[cls] || 0) + 1;
    });

    return Object.keys(counts).reduce((a, b) => counts[a] > counts[b] ? a : b);
  }

  /**
   * Split data menjadi training dan testing
   */
  splitData(data: DataUnified[], splitRatio: number = 0.8): {
    training: DataUnified[];
    testing: DataUnified[];
  } {
    const shuffled = [...data].sort(() => Math.random() - 0.5);
    const splitIndex = Math.floor(shuffled.length * splitRatio);
    
    return {
      training: shuffled.slice(0, splitIndex),
      testing: shuffled.slice(splitIndex)
    };
  }

  /**
   * Print tree structure (untuk debugging)
   */
  printTree(tree: TreeNode, prefix: string = ''): string {
    let result = '';

    if (tree.type === 'leaf') {
      result += `${prefix}→ ${tree.label}\n`;
    } else if (tree.branches) {
      for (const [value, branch] of Object.entries(tree.branches)) {
        result += `${prefix}${tree.attribute} = ${value}\n`;
        result += this.printTree(branch, prefix + '  ');
      }
    }

    return result;
  }
}

export default C45Algorithm;
