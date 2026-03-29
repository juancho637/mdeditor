// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Plugin = () => (tree: any) => void;

const BLOCK_TYPES = new Set([
  'heading', 'paragraph', 'blockquote', 'code',
  'list', 'listItem', 'table', 'thematicBreak',
  'html', 'image',
]);

/**
 * Remark plugin that annotates block-level elements with their source line number.
 * This enables accurate sync scroll between the editor and the rendered preview.
 */
export const remarkSourceLines: Plugin = () => {
  return (tree: any) => {
    function walk(node: any) {
      if (node.position && BLOCK_TYPES.has(node.type)) {
        if (!node.data) node.data = {};
        if (!node.data.hProperties) node.data.hProperties = {};
        node.data.hProperties['data-source-line'] = String(node.position.start.line);
      }
      if (node.children) {
        for (const child of node.children) {
          walk(child);
        }
      }
    }
    walk(tree);
  };
};
