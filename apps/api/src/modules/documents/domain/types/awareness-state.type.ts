export type AwarenessStateType = {
  user: {
    id: string;
    name: string;
    color: string;
  };
  cursor: {
    anchor: number;
    head: number;
  } | null;
  isAI: boolean;
};
