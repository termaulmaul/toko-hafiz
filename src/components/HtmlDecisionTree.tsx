
import React from 'react';

interface TreeNode {
  type: 'binary' | 'nary' | 'leaf' | 'categorical';
  value?: string | number;
  title?: string;
  content?: string;
  label?: string;
  attribute?: string;
  children?: TreeNode[];
  branches?: Record<string, TreeNode>;
  edgeLabel?: string;
}

interface HtmlDecisionTreeProps {
  tree: TreeNode;
}

const HtmlDecisionTree: React.FC<HtmlDecisionTreeProps> = ({ tree }) => {
  // Transform the existing tree structure to match the visualization needs if necessary
  // The current tree structure seems to be:
  // { type: 'categorical', attribute: 'name', children: [...], edgeLabel: 'value' }
  // or { type: 'leaf', label: 'class' }

  const renderTree = (node: TreeNode) => {
    const isLeaf = node.type === 'leaf' || (!node.children && !node.branches);
    
    return (
      <div className="decision-tree-node">
        {/* Node Content */}
        <div className={`node-content ${isLeaf ? 'leaf-node' : 'decision-node'}`}>
          {isLeaf ? (
            <div className={`leaf-content ${
              node.label === 'Rendah' ? 'bg-red-100 border-red-300 text-red-800' :
              node.label === 'Cukup' ? 'bg-yellow-100 border-yellow-300 text-yellow-800' :
              'bg-green-100 border-green-300 text-green-800'
            }`}>
              <span className="font-bold">{node.label}</span>
            </div>
          ) : (
            <div className="decision-content bg-blue-100 border-blue-300 text-blue-800">
              <span className="font-bold">{node.attribute || node.title}</span>
            </div>
          )}
        </div>

        {/* Children */}
        {!isLeaf && (node.children || node.branches) && (
          <div className="node-children">
            {node.children ? (
              node.children.map((child, index) => (
                <div key={index} className="child-wrapper">
                  {child.edgeLabel && (
                    <div className="edge-label">
                      <span>{child.edgeLabel}</span>
                    </div>
                  )}
                  {renderTree(child)}
                </div>
              ))
            ) : node.branches ? (
              Object.entries(node.branches).map(([key, child], index) => (
                <div key={index} className="child-wrapper">
                  <div className="edge-label">
                    <span>{key}</span>
                  </div>
                  {renderTree(child as TreeNode)}
                </div>
              ))
            ) : null}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="html-decision-tree-container overflow-auto p-4">
      <style>{`
        .html-decision-tree-container {
          display: flex;
          justify-content: center;
          width: 100%;
          overflow-x: auto; /* Allow horizontal scrolling if tree is wide */
          padding-bottom: 20px;
        }
        
        .decision-tree-node {
          display: flex;
          flex-direction: column;
          align-items: center;
          position: relative;
          /* padding-top: 20px; Removed padding top from node */
        }

        .node-content {
          z-index: 10;
          position: relative;
          /* margin-bottom: 20px; Removed margin bottom */
        }

        .decision-content, .leaf-content {
          padding: 10px 15px;
          border-radius: 8px;
          border: 2px solid;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          min-width: 100px;
          text-align: center;
          white-space: nowrap; /* Prevent text wrapping */
        }

        .node-children {
          display: flex;
          justify-content: center;
          position: relative;
          flex-direction: row; /* Ensure horizontal layout */
          padding-top: 20px; /* Add space for connecting lines */
        }

        .node-children::before {
          content: '';
          position: absolute;
          top: 0;
          left: 50%;
          width: 0;
          height: 20px;
          border-left: 2px solid #ccc;
          transform: translateY(-100%);
        }

        .child-wrapper {
          display: flex;
          flex-direction: column;
          align-items: center;
          position: relative;
          padding: 20px 10px 0;
          /* flex: 1; Remove flex: 1 to allow natural width */
        }

        .child-wrapper::before {
          content: '';
          position: absolute;
          top: 0;
          left: 50%;
          width: 0;
          height: 20px;
          border-left: 2px solid #ccc;
        }

        .child-wrapper::after {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          width: 50%;
          height: 20px;
          border-top: 2px solid #ccc;
        }

        .child-wrapper:last-child::after {
          left: 50%;
          width: 50%;
          border-top: 2px solid #ccc;
          border-left: 0;
          transform: translateX(-100%); /* Fix transform */
        }

        .child-wrapper:only-child::after {
          display: none;
        }
        
        .child-wrapper:only-child {
          padding-top: 0;
        }
        
        .child-wrapper:first-child::after {
          left: 50%;
          width: 50%;
          border-top: 2px solid #ccc;
        }
        
        .child-wrapper:last-child::after {
          left: 0;
          width: 50%;
          border-top: 2px solid #ccc;
        }
        
        /* Fix for middle children lines */
        .child-wrapper:not(:first-child):not(:last-child)::after {
          width: 100%;
          left: 0;
          border-top: 2px solid #ccc;
        }

        .edge-label {
          background: white;
          padding: 2px 6px;
          border-radius: 4px;
          border: 1px solid #e5e7eb;
          font-size: 12px;
          color: #4b5563;
          position: absolute;
          top: -10px;
          z-index: 5;
          white-space: nowrap;
          transform: translateY(-50%); /* Center vertically on the line */
        }
      `}</style>
      {renderTree(tree)}
    </div>
  );
};

export default HtmlDecisionTree;
