export type McpToolResponseType = {
  content: Array<{ type: 'text'; text: string }>;
  isError?: boolean;
};
