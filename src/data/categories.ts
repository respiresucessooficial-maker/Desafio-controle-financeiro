export interface CategoryDef {
  name: string;
  icon: string;
  color: string;
}

export const CATEGORIES: CategoryDef[] = [
  { name: 'Alimentação', icon: 'ShoppingCart', color: '#EF4444' },
  { name: 'Moradia', icon: 'Home', color: '#F59E0B' },
  { name: 'Transporte', icon: 'Car', color: '#3B82F6' },
  { name: 'Entretenimento', icon: 'Tv', color: '#8B5CF6' },
  { name: 'Saúde', icon: 'Heart', color: '#EC4899' },
  { name: 'Renda', icon: 'TrendingUp', color: '#22C55E' },
  { name: 'Investimentos', icon: 'BarChart2', color: '#10B981' },
  { name: 'Educação', icon: 'BookOpen', color: '#6366F1' },
  { name: 'Outros', icon: 'Package', color: '#6B7280' },
];

export function getCategoryDef(name: string): CategoryDef {
  return CATEGORIES.find((c) => c.name === name) ?? { name, icon: 'Package', color: '#6B7280' };
}
