export interface BaseItem {
    id: number;
    title: string;
    content: string;
    tags: string[];
    userId: number;
    createdAt: string;
  }
  
  export interface Thread extends BaseItem {}
  
  export interface Recipe extends BaseItem {
    ingredients: string;
    steps: string;
  }
  
  export type Item = Thread | Recipe;
  
  export const isRecipe = (item: Item): item is Recipe => {
    return 'ingredients' in item && 'steps' in item;
  };