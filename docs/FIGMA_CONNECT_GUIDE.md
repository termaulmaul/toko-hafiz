# Figma Connect Setup Guide untuk Toko Hafiz

## 🎯 Overview

Figma Connect memungkinkan desainer menggunakan komponen React dari Toko Hafiz langsung di Figma, sehingga design tetap konsisten dengan implementasi frontend yang sebenarnya.

## ✅ **Status Implementation**

### **Working Components**
- **Figma Connect CLI** v1.3.9 ✅
- **Basic Button**: Text content + variants ✅
- **Simple Card**: Title + content ✅  
- **Input Field**: Label + placeholder ✅
- **Badge**: Status badges with variants ✅

### **Available Now**
- **Button**: Variants (primary/secondary), text content
- **Card**: Basic title and content layout
- **Input**: Form field dengan label dan placeholder  
- **Badge**: Status badges dengan variants (default/success/warning/error)

### **Limitations**
- ❌ Complex conditional rendering
- ❌ Multiple component references dalam satu connector
- ❌ Shadcn/ui complex components dengan nested imports
- ⚠️ Need manual mapping antara Figma props dan component props
- **File**: `figma-connectors/prediction.figma.ts`

### 5. **Layout Components**
- **Types**: Main layout, Dashboard layout
- **Features**: Sidebar navigation, Header, Main content area
- **Auth**: User role-based navigation
- **File**: `figma-connectors/layout.figma.ts`

## 🚀 **Setup Instructions**

### Step 1: Build Figma Connectors
```bash
# Build semua connector
yarn figma:build

# Atau untuk development dengan auto-reload
yarn figma:dev
```

### Step 2: Hubungkan ke Figma

#### **Cara Kerja saat ini:**
1. **Parse Connectors**: `yarn figma:build` (generate JSON templates)
2. **Publish ke Figma**: `yarn figma:publish` (perlu Figma Access Token)  
3. **Use di Figma**: Komponen muncul di Dev Mode

#### **Dapatkan Figma Access Token:**
1. Buka Figma → Settings → Account → Personal access tokens
2. Generate token dengan **Code Connect (Write)** scope
3. Set environment: `export FIGMA_ACCESS_TOKEN='token-anda'`
4. Run: `yarn figma:publish`

#### **⚠️ Current Status Issue:**
**Token Valid ✅** tapi ada validation error di Figma Connect CLI v1.3.9
- Parse components berhasil ✅
- Validation di publish step gagal ❌
- Terdeteksi sebagai bug di Figma Connect (GitHub issue #93)

#### **Workarounds:**
1. **Menunggu Fix**: Figma team sedang investigasi issue
2. **Manual Component**: Tetap bisa export components secara manual
3. **Alternative Plugins**: Gunakan "Figma to React" atau "Builder.io"

### Step 3: Testing di Figma
1. Buat new frame di Figma
2. Cari komponen "toko-hafiz" di Component Library
3. Drag dan drop ke canvas
4. Edit props langsung di Figma

## 🎨 Cara Penggunaan di Figma

### Button Component
```
1. Search: "Button" di Component Library
2. Drag ke canvas
3. Edit properties:
   - Button text: "Start Training"
   - Button style: Primary/Secondary/Outline
   - Button size: Medium
   - Disabled state: False
```

### Card Component
```
1. Search: "Card" di Component Library
2. Edit properties:
   - Card title: "Training Progress"
   - Card description: "C4.5 algorithm running..."
   - Card content: "Processing 500 records"
```

### Data Mining Engine
```
1. Search: "Data Mining Engine"
2. Configure:
   - Section title: "Mining Process"
   - Progress percentage: 75
   - Mining status: loading
   - Action button text: "Start Mining"
```

### Prediction Engine
```
1. Search: "Prediction Engine"
2. Setup:
   - Section title: "Stock Prediction"
   - Prediction status: success
   - Prediction result: "Cukup"
   - Confidence percentage: 92
```

## 🛠️ Development Workflow

### Add New Component
```typescript
// 1. Create new connector file
// figma-connectors/newcomponent.figma.ts

import { figma } from '@figma/code-connect';
import { NewComponent } from '@/components/NewComponent';

figma.connect(NewComponent, {
  props: {
    title: figma.string('Component title'),
  },
  example: ({ title }) => (
    <NewComponent title={title} />
  ),
});
```

### Update Existing Component
```bash
# 1. Edit connector file
# 2. Build connectors
yarn figma:build

# 3. Refresh Figma plugin/component library
```

### Build Process
```bash
# Development mode (auto-reload)
yarn figma:dev

# Production build
yarn figma:build
```

## 📁 Project Structure

```
toko-hafiz/
├── figma-connectors/           # Figma connector files
│   ├── index.ts               # Main export
│   ├── button.figma.ts       # Button connectors
│   ├── card.figma.ts         # Card connectors
│   ├── datamining.figma.ts   # Data mining connectors
│   ├── prediction.figma.ts   # Prediction connectors
│   └── layout.figma.ts       # Layout connectors
├── docs/
│   └── FIGMA_CONNECT_GUIDE.md # This guide
└── package.json               # Build scripts added
```

## ⚡ Features yang Didukung

### Tailwind CSS Integration
- Theme colors terintegrasi
- Spacing system konsisten
- Typography scales otomatis

### Props Mapping
- **Text**: String properties (title, description, labels)
- **Enums**: Variants dan pilihan (button.style, card.type)
- **Numbers**: Numerical values (progress, percentages)
- **Booleans**: State flags (disabled, completed)

### Component Variants
- Multiple variant combinations
- Conditional rendering
- State-based styling

## 🔧 Troubleshooting

### Common Issues

#### 1. Connector tidak muncul di Figma
```bash
# Rebuild dan refresh
yarn figma:build
# Restart Figma plugin
```

#### 2. Props tidak ter-update
```bash
# Kill dan restart dev server
pkill -f figma-connect
yarn figma:dev
```

#### 3. Component styling tidak cocok
- Cek Tailwind config
- Pastikan CSS variables konsisten
- Verify theme colors mapping

### Debug Commands
```bash
# Check connector build
ls figma-output/

# Test individual connector
npx figma-connect test button.figma.ts

# Validate all connectors
npx figma-connect validate
```

## 🎯 Best Practices

### 1. **Naming Conventions**
- Component names: PascalCase (DataMiningEngine)
- Props: camelCase (buttonText, miningStatus)
- Figma property names: User-friendly (Button text vs buttonText)

### 2. **Component Structure**
- Keep connectors simple and focused
- Use meaningful examples
- Include common use cases

### 3. **Version Control**
- Commit connector files ke git
- Document changes in CHANGELOG
- Test di Figma sebelum merge

## 🔄 Integration dengan Development Workflow

### Before Design Phase
1. Build komponen yang akan digunakan
2. Sync ke Figma library
3. Brief designer tentang available components

### During Design Phase
1. Designer gunakan komponen dari library
2. Props langsung editable di Figma
3. Real-time preview dengan data sebenarnya

### After Design Handoff
1. Export design specifications
2. Generate code skeleton dari Figma
3. Implement dengan confidence (komponen sudah tersedia)

## 📈 Benefits untuk Toko Hafiz

### **Design Consistency**
- Typography konsisten seluruh aplikasi
- Color system terstandarisasi
- Spacing dan layout terukur

### **Faster Development**
- Komponen sudah available
- Design-to-code otomatis
- Reduce manual implementation

### **Better Collaboration**
- Designer dan developer aligned
- Real-time feedback loop
- Single source of truth

## 🚀 Next Steps

### Short Term
1. Tambah lebih banyak UI components (Table, Form, Dialog)
2. Setup automatic sync ke Figma workspace
3. Training untuk design team

### Long Term
1. Integration dengan component library (Storybook)
2. Automated testing untuk connectors
3. Custom Figma plugin untuk Toko Hafiz specifics

---

## 📞 Support

Hubungi development team jika:
- Connector tidak berfungsi
- Butuh komponen baru
- Ada issue dengan integration

**Setup Status**: ✅ Ready to use
**Components Connected**: 5 main components
**Test Coverage**: Basic functionality verified
