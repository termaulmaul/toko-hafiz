import { figma } from '@figma/code-connect';

// ========== BASIC BUTTONS ==========
figma.connect('Primary Button', {
  props: {
    text: figma.string('Button text'),
    disabled: figma.boolean('Disabled')
  },
  example: ({ text, disabled }) => (
    <button className="btn btn-primary" disabled={disabled}>
      {text}
    </button>
  )
});

figma.connect('Secondary Button', {
  props: {
    text: figma.string('Button text'),
    disabled: figma.boolean('Disabled')
  },
  example: ({ text, disabled }) => (
    <button className="btn btn-secondary" disabled={disabled}>
      {text}
    </button>
  )
});

// ========== BASIC CARDS ==========
figma.connect('Stats Card', {
  props: {
    title: figma.string('Card title'),
    value: figma.string('Card value'),
    changeText: figma.string('Change text')
  },
  example: ({ title, value, changeText }) => (
    <div className="stats-card">
      <div className="stats-header">
        <div className="stats-icon">📦</div>
        <span className="stats-change">{changeText}</span>
      </div>
      <div className="stats-body">
        <div className="stats-value">{value}</div>
        <div className="stats-label">{title}</div>
      </div>
    </div>
  )
});

figma.connect('Basic Card', {
  props: {
    title: figma.string('Card title'),
    content: figma.string('Card content')
  },
  example: ({ title, content }) => (
    <div className="card">
      <div className="card-header">
        <h3>{title}</h3>
      </div>
      <div className="card-body">
        <p>{content}</p>
      </div>
    </div>
  )
});

// ========== FORM COMPONENTS ==========
figma.connect('Input Field', {
  props: {
    label: figma.string('Input label'),
    placeholder: figma.string('Placeholder text')
  },
  example: ({ label, placeholder }) => (
    <div className="form-group">
      <label>{label}</label>
      <input type="text" placeholder={placeholder} />
    </div>
  )
});

figma.connect('Select Field', {
  props: {
    label: figma.string('Select label'),
    placeholder: figma.string('Placeholder text')
  },
  example: ({ label, placeholder }) => (
    <div className="form-group">
      <label>{label}</label>
      <select>
        <option value="">{placeholder}</option>
        <option value="option1">Option 1</option>
        <option value="option2">Option 2</option>
      </select>
    </div>
  )
});

// ========== ALERTS ==========
figma.connect('Success Alert', {
  props: {
    title: figma.string('Alert title'),
    message: figma.string('Alert message')
  },
  example: ({ title, message }) => (
    <div className="alert alert-success">
      <div className="alert-icon">✓</div>
      <div className="alert-content">
        <strong>{title}</strong>
        <p>{message}</p>
      </div>
    </div>
  )
});

figma.connect('Error Alert', {
  props: {
    title: figma.string('Alert title'),
    message: figma.string('Alert message')
  },
  example: ({ title, message }) => (
    <div className="alert alert-error">
      <div className="alert-icon">✕</div>
      <div className="alert-content">
        <strong>{title}</strong>
        <p>{message}</p>
      </div>
    </div>
  )
});

// ========== TABLE ==========
figma.connect('Data Table', {
  props: {
    title: figma.string('Table title'),
    column1: figma.string('First column'),
    column2: figma.string('Second column')
  },
  example: ({ title, column1, column2 }) => (
    <div className="table-container">
      <div className="table-header">
        <h3>{title}</h3>
        <div className="table-actions">
          <button className="btn btn-outline">Filter</button>
          <button className="btn btn-outline">Export</button>
        </div>
      </div>
      <div className="table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              <th>{column1}</th>
              <th>{column2}</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Sample Data 1</td>
              <td>Sample Data 2</td>
              <td>
                <div className="table-actions">
                  <button className="btn btn-ghost btn-sm">View</button>
                  <button className="btn btn-ghost btn-sm">Edit</button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  )
});

// ========== PAGE COMPONENTS ==========

// DASHBOARD PAGE (Simplified)
figma.connect('Dashboard Page', {
  props: {
    pageTitle: figma.string('Page title'),
    totalProducts: figma.string('Total products'),
    lowStock: figma.string('Low stock'),
    totalValue: figma.string('Total value')
  },
  example: ({ pageTitle, totalProducts, lowStock, totalValue }) => (
    <div className="dashboard-layout">
      <header className="page-header">
        <h1>{pageTitle}</h1>
        <div className="header-actions">
          <button className="btn btn-outline">Export</button>
          <button className="btn btn-primary">New Prediction</button>
        </div>
      </header>
      
      <main className="dashboard-content">
        <div className="stats-grid">
          <div className="stats-card blue">
            <div className="stats-header">
              <div className="stats-icon">📦</div>
              <span className="stats-change">+12 bulan ini</span>
            </div>
            <div className="stats-body">
              <div className="stats-value">{totalProducts}</div>
              <div className="stats-label">Total Barang</div>
            </div>
          </div>
          
          <div className="stats-card red">
            <div className="stats-header">
              <div className="stats-icon">⚠️</div>
              <span className="stats-change">Perlu perhatian</span>
            </div>
            <div className="stats-body">
              <div className="stats-value">{lowStock}</div>
              <div className="stats-label">Stok Rendah</div>
            </div>
          </div>
          
          <div className="stats-card green">
            <div className="stats-header">
              <div className="stats-icon">💰</div>
              <span className="stats-change">+8.3% dari bulan lalu</span>
            </div>
            <div className="stats-body">
              <div className="stats-value">{totalValue}</div>
              <div className="stats-label">Total Nilai</div>
            </div>
          </div>
        </div>
        
        <div className="quick-actions">
          <h2>Quick Actions</h2>
          <div className="actions-grid">
            <div className="action-card primary">
              <div className="action-icon">📈</div>
              <h3>Data Mining</h3>
              <p>Process inventory data</p>
            </div>
            
            <div className="action-card success">
              <div className="action-icon">🗄️</div>
              <h3>Data Stok</h3>
              <p>View stock levels</p>
            </div>
            
            <div className="action-card warning">
              <div className="action-icon">📝</div>
              <h3>Data Latih</h3>
              <p>Training data</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
});

// DATA MINING PAGE (Simplified)
figma.connect('Data Mining Page', {
  props: {
    progressValue: figma.string('Progress percentage'),
    qualityScore: figma.string('Quality score'),
    totalRecords: figma.string('Total records')
  },
  example: ({ progressValue, qualityScore, totalRecords }) => (
    <div className="data-mining-layout">
      <header className="page-header">
        <div className="header-content">
          <div className="header-icon">🧠</div>
          <div>
            <h1>Data Mining</h1>
            <p>Process inventory data menggunakan algoritma C4.5</p>
          </div>
        </div>
      </header>
      
      <main className="data-mining-content">
        <div className="mining-grid">
          <div className="quality-card">
            <div className="card-header">
              <div className="card-icon">🗄️</div>
              <h3>Data Quality Check</h3>
            </div>
            <div className="card-content">
              <div className="quality-metrics">
                <div className="metric">
                  <span className="metric-label">Quality Score</span>
                  <span className="metric-value">{qualityScore}</span>
                </div>
                <div className="metric">
                  <span className="metric-label">Total Records</span>
                  <span className="metric-value">{totalRecords}</span>
                </div>
              </div>
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: `${progressValue}%` }} />
              </div>
              <div className="progress-value">{progressValue}%</div>
            </div>
          </div>
          
          <div className="process-card">
            <div className="card-header">
              <div className="card-icon">🧠</div>
              <h3>Mining Process</h3>
            </div>
            <div className="card-content">
              <div className="process-content">
                <div className="process-status">
                  <div className="status-icon">📊</div>
                  <p>Ready to start mining process</p>
                </div>
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: '0%' }} />
                </div>
                <div className="progress-value">0%</div>
              </div>
              <button className="btn btn-primary">
                ▶️ Start Mining
              </button>
            </div>
          </div>
          
          <div className="results-card">
            <div className="card-header">
              <div className="card-icon">📈</div>
              <h3>Model Results</h3>
            </div>
            <div className="card-content">
              <div className="results-placeholder">
                <div className="results-icon">📊</div>
                <p>No results yet. Run mining process to see results.</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
});

// DATA LATIH PAGE (Simplified)
figma.connect('Data Latih Page', {
  props: {
    totalData: figma.string('Total data'),
    trainingData: figma.string('Training data'),
    testingData: figma.string('Testing data')
  },
  example: ({ totalData, trainingData, testingData }) => (
    <div className="data-latih-layout">
      <header className="page-header">
        <div className="header-content">
          <div className="header-icon">📝</div>
          <div>
            <h1>Data Latih</h1>
            <p>Management training dan testing data untuk C4.5 algorithm</p>
          </div>
        </div>
      </header>
      
      <main className="data-latih-content">
        <div className="stats-overview">
          <div className="overview-card">
            <div className="overview-header">
              <div className="card-icon">🗄️</div>
              <h3>Total Data</h3>
            </div>
            <div className="overview-content">
              <div className="overview-value">{totalData}</div>
              <div className="overview-label">Records</div>
            </div>
          </div>
          
          <div className="overview-card">
            <div className="overview-header">
              <div className="card-icon">📈</div>
              <h3>Training Data</h3>
            </div>
            <div className="overview-content">
              <div className="overview-value">{trainingData}</div>
              <div className="overview-label">Records</div>
            </div>
          </div>
          
          <div className="overview-card">
            <div className="overview-header">
              <div className="card-icon">👁️</div>
              <h3>Testing Data</h3>
            </div>
            <div className="overview-content">
              <div className="overview-value">{testingData}</div>
              <div className="overview-label">Records</div>
            </div>
          </div>
        </div>
        
        <div className="data-table-card">
          <div className="table-header">
            <div className="header-left">
              <h3>Training Data Table</h3>
              <span className="record-count">{trainingData} records</span>
            </div>
            <div className="header-actions">
              <button className="btn btn-outline">
                📤 Upload CSV
              </button>
              <button className="btn btn-outline">Export</button>
            </div>
          </div>
          <div className="table-content">
            <div className="table-placeholder">
              <div className="table-icon">🗄️</div>
              <p>No data loaded. Upload CSV file or connect to database.</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
});

// DATA STOK PAGE (Simplified)
figma.connect('Data Stok Page', {
  props: {
    totalProducts: figma.string('Total products'),
    lowStock: figma.string('Low stock products')
  },
  example: ({ totalProducts, lowStock }) => (
    <div className="data-stok-layout">
      <header className="page-header">
        <div className="header-content">
          <div className="header-icon">📦</div>
          <div>
            <h1>Data Stok</h1>
            <p>Inventory management dan stock level monitoring</p>
          </div>
        </div>
      </header>
      
      <main className="data-stok-content">
        <div className="inventory-overview">
          <div className="inventory-card">
            <div className="inventory-header">
              <div className="card-icon">📦</div>
              <h3>Total Products</h3>
            </div>
            <div className="inventory-content">
              <div className="inventory-value">{totalProducts}</div>
              <div className="inventory-label">Items</div>
            </div>
          </div>
          
          <div className="inventory-card danger">
            <div className="inventory-header">
              <div className="card-icon">⚠️</div>
              <h3>Low Stock</h3>
            </div>
            <div className="inventory-content">
              <div className="inventory-value">{lowStock}</div>
              <div className="inventory-label">Need attention</div>
            </div>
          </div>
        </div>
        
        <div className="stock-table-card">
          <div className="table-header">
            <h3>Stock Levels</h3>
            <div className="header-actions">
              <button className="btn btn-primary">Update Stock</button>
            </div>
          </div>
          <div className="table-content">
            <div className="table-placeholder">
              <div className="table-icon">📦</div>
              <p>No stock data available. Add products to start tracking inventory.</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
});

// SIDEBAR NAVIGATION (Simplified)
figma.connect('Sidebar Navigation', {
  props: {
    brandName: figma.string('Brand name'),
    activePage: figma.string('Active page'),
    userName: figma.string('User name')
  },
  example: ({ brandName, activePage, userName }) => (
    <div className="sidebar">
      <div className="sidebar-header">
        <div className="sidebar-logo">📦</div>
        <span className="sidebar-brand">{brandName}</span>
      </div>
      
      <nav className="sidebar-nav">
        <button className={`nav-item ${activePage === 'Dashboard' ? 'active' : ''}`}>
          <span className="nav-icon">🏠</span>
          Dashboard
        </button>
        
        <button className={`nav-item ${activePage === 'Data Mining' ? 'active' : ''}`}>
          <span className="nav-icon">📈</span>
          Data Mining
        </button>
        
        <button className={`nav-item ${activePage === 'Data Stok' ? 'active' : ''}`}>
          <span className="nav-icon">🗄️</span>
          Data Stok
        </button>
        
        <button className={`nav-item ${activePage === 'Data Latih' ? 'active' : ''}`}>
          <span className="nav-icon">📝</span>
          Data Latih
        </button>
      </nav>
      
      <div className="sidebar-footer">
        <div className="user-info">
          <div className="user-avatar">👤</div>
          <span className="user-name">{userName}</span>
        </div>
      </div>
    </div>
  )
});
