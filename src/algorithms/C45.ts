// C4.5 Algorithm Implementation for Item Forecast Hub
// Ported from toko-hafizh project

export interface TreeNode {
  type: 'leaf' | 'node' | 'categorical';
  label?: string;
  attribute?: string;
  threshold?: number;
  left?: TreeNode;
  right?: TreeNode;
  branches?: Record<string, TreeNode>;
  gainRatio?: number;
}

export interface TrainingData {
  [key: string]: string | number;
}

export interface PredictionResult {
  prediction: string;
  confidence: number;
  path: string[];
}

export interface ModelMetrics {
  accuracy: number;
  precision: number;
  recall: number;
  f1Score: number;
  confusionMatrix: {
    truePositive: number;
    falsePositive: number;
    trueNegative: number;
    falseNegative: number;
  };
}

export class C45Algorithm {
  private minSamples: number;
  private minGainRatio: number;

  constructor(minSamples: number = 5, minGainRatio: number = 0.01) {
    this.minSamples = minSamples;
    this.minGainRatio = minGainRatio;
  }

  /**
   * Calculate entropy for a given dataset
   */
  calculateEntropy(data: TrainingData[], targetAttribute: string): number {
    if (!data || data.length === 0) {
      throw new Error('Data tidak boleh kosong');
    }

    const labels = data.map(row => row[targetAttribute]);
    const counts: Record<string, number> = {};
    
    labels.forEach(label => {
      counts[label as string] = (counts[label as string] || 0) + 1;
    });

    const total = labels.length;
    let entropy = 0;

    Object.values(counts).forEach(count => {
      if (count > 0) {
        const p = count / total;
        entropy -= p * Math.log2(p);
      }
    });

    return entropy;
  }

  /**
   * Calculate gain ratio for an attribute
   */
  calculateGainRatio(
    data: TrainingData[], 
    attribute: string, 
    targetAttribute: string
  ): number {
    const entropyBefore = this.calculateEntropy(data, targetAttribute);
    const groups = this.groupBy(data, attribute);
    const total = data.length;
    
    let entropyAfter = 0;
    let splitInfo = 0;

    Object.values(groups).forEach(group => {
      const weight = group.length / total;
      entropyAfter += weight * this.calculateEntropy(group, targetAttribute);
      
      if (weight > 0) {
        splitInfo -= weight * Math.log2(weight);
      }
    });

    const informationGain = entropyBefore - entropyAfter;
    const gainRatio = splitInfo === 0 ? 0 : informationGain / splitInfo;

    return gainRatio;
  }

  /**
   * Group data by attribute value
   */
  groupBy(data: TrainingData[], attribute: string): Record<string, TrainingData[]> {
    const groups: Record<string, TrainingData[]> = {};
    
    data.forEach(row => {
      const key = row[attribute] as string;
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(row);
    });

    return groups;
  }

  /**
   * Get majority class from array of classes
   */
  private getMajorityClass(classes: (string | number)[]): string {
    const counts: Record<string, number> = {};
    
    classes.forEach(cls => {
      const key = cls as string;
      counts[key] = (counts[key] || 0) + 1;
    });

    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])[0][0];
  }

  /**
   * Build decision tree using C4.5 algorithm
   */
  buildTree(
    data: TrainingData[], 
    targetAttribute: string = 'status_stok'
  ): TreeNode {
    // Validation
    if (!data || data.length === 0) {
      throw new Error('Data tidak boleh kosong dan harus berupa array');
    }

    if (!data[0] || typeof data[0] !== 'object') {
      throw new Error('Data harus berupa array of objects');
    }

    if (!(targetAttribute in data[0])) {
      throw new Error(`Target attribute '${targetAttribute}' tidak ditemukan dalam data`);
    }

    // Minimum samples criteria
    if (data.length < this.minSamples) {
      const classes = data.map(row => row[targetAttribute]);
      return { type: 'leaf', label: this.getMajorityClass(classes) };
    }

    // Calculate initial entropy
    const entropy = this.calculateEntropy(data, targetAttribute);

    // If entropy = 0, all data have the same class
    if (entropy === 0) {
      const labels = data.map(row => row[targetAttribute]);
      return { type: 'leaf', label: labels[0] as string };
    }

    // Calculate gain ratio for each attribute
    const attributes = Object.keys(data[0]);
    const filteredAttributes = attributes.filter(attr => 
      attr !== targetAttribute && 
      !['id', 'created_at', 'updated_at', 'type'].includes(attr)
    );

    if (filteredAttributes.length === 0) {
      throw new Error('Tidak ada atribut untuk split');
    }

    let bestAttribute: string | null = null;
    let maxGainRatio = 0;

    filteredAttributes.forEach(attribute => {
      const gainRatio = this.calculateGainRatio(data, attribute, targetAttribute);
      if (gainRatio > maxGainRatio) {
        maxGainRatio = gainRatio;
        bestAttribute = attribute;
      }
    });

    // Minimum gain ratio threshold
    if (!bestAttribute || maxGainRatio < this.minGainRatio) {
      const labels = data.map(row => row[targetAttribute]);
      return { type: 'leaf', label: this.getMajorityClass(labels) };
    }

    // Build decision tree
    const tree: TreeNode = {
      type: 'categorical',
      attribute: bestAttribute,
      gainRatio: maxGainRatio,
      branches: {}
    };

    // Group data by best attribute
    const groups = this.groupBy(data, bestAttribute);

    Object.entries(groups).forEach(([value, group]) => {
      // If all data in group have same label, make it a leaf
      const labels = group.map(row => row[targetAttribute]);
      const uniqueLabels = [...new Set(labels)];
      
      if (uniqueLabels.length === 1) {
        tree.branches![value] = { 
          type: 'leaf', 
          label: uniqueLabels[0] as string 
        };
      } else {
        // Recursive call
        tree.branches![value] = this.buildTree(group, targetAttribute);
      }
    });

    return tree;
  }

  /**
   * Make prediction using the decision tree
   */
  predict(tree: TreeNode, data: TrainingData): PredictionResult {
    const path: string[] = [];
    
    const traverse = (node: TreeNode): string => {
      if (node.type === 'leaf') {
        return node.label!;
      }

      if (!node.attribute || !node.branches) {
        return 'Cukup'; // Default prediction
      }

      const value = data[node.attribute];
      path.push(`${node.attribute}=${value}`);

      if (value === null || value === undefined || !node.branches[value as string]) {
        return 'Cukup'; // Default prediction
      }

      return traverse(node.branches[value as string]);
    };

    const prediction = traverse(tree);
    
    // Simple confidence calculation based on tree depth
    const confidence = Math.max(0.5, 1 - (path.length * 0.1));
    
    return {
      prediction,
      confidence,
      path
    };
  }

  /**
   * Evaluate model with test data
   */
  evaluate(
    tree: TreeNode, 
    testData: TrainingData[], 
    targetAttribute: string
  ): ModelMetrics {
    const predictions = testData.map(row => this.predict(tree, row).prediction);
    const actuals = testData.map(row => row[targetAttribute] as string);

    // Find positive class (assuming it contains 'restock' or similar)
    const positiveClass = [...new Set(actuals)].find(cls => 
      cls.toLowerCase().includes('restock') || cls.toLowerCase().includes('perlu')
    ) || actuals[0];

    let truePositive = 0;
    let falsePositive = 0;
    let trueNegative = 0;
    let falseNegative = 0;

    actuals.forEach((actual, index) => {
      const predicted = predictions[index];
      
      if (actual === positiveClass && predicted === positiveClass) {
        truePositive++;
      } else if (actual !== positiveClass && predicted === positiveClass) {
        falsePositive++;
      } else if (actual !== positiveClass && predicted !== positiveClass) {
        trueNegative++;
      } else {
        falseNegative++;
      }
    });

    const accuracy = (truePositive + trueNegative) / actuals.length;
    const precision = truePositive / (truePositive + falsePositive) || 0;
    const recall = truePositive / (truePositive + falseNegative) || 0;
    const f1Score = 2 * (precision * recall) / (precision + recall) || 0;

    return {
      accuracy,
      precision,
      recall,
      f1Score,
      confusionMatrix: {
        truePositive,
        falsePositive,
        trueNegative,
        falseNegative
      }
    };
  }
}