export interface CategoryDef {
  name: string;
  icon: string;
  color: string;
  type: 'expense' | 'income' | 'both';
}

export const CATEGORIES: CategoryDef[] = [
  // Despesas
  { name: 'Alimentação',    icon: 'ShoppingCart', color: '#EF4444', type: 'expense' },
  { name: 'Moradia',        icon: 'Home',         color: '#F59E0B', type: 'expense' },
  { name: 'Transporte',     icon: 'Car',          color: '#3B82F6', type: 'expense' },
  { name: 'Entretenimento', icon: 'Tv',           color: '#8B5CF6', type: 'expense' },
  { name: 'Saúde',          icon: 'Heart',        color: '#EC4899', type: 'expense' },
  { name: 'Educação',       icon: 'BookOpen',     color: '#6366F1', type: 'expense' },
  // Receitas
  { name: 'Salário',        icon: 'TrendingUp',   color: '#22C55E', type: 'income'  },
  { name: 'Freelance',      icon: 'Briefcase',    color: '#16A34A', type: 'income'  },
  { name: 'Investimentos',  icon: 'BarChart2',    color: '#10B981', type: 'income'  },
  // Ambos
  { name: 'Outros',         icon: 'Package',      color: '#6B7280', type: 'both'    },
];

export const EXPENSE_CATEGORIES = CATEGORIES.filter((c) => c.type === 'expense' || c.type === 'both');
export const INCOME_CATEGORIES  = CATEGORIES.filter((c) => c.type === 'income'  || c.type === 'both');

export function getCategoryDef(name: string): CategoryDef {
  return CATEGORIES.find((c) => c.name === name) ?? { name, icon: 'Package', color: '#6B7280', type: 'both' };
}

export const AVAILABLE_ICONS = [
  'ShoppingCart', 'Home', 'Car', 'Tv', 'Heart', 'TrendingUp', 'BarChart2',
  'BookOpen', 'Package', 'Briefcase', 'Music', 'Zap', 'UtensilsCrossed',
  'Dumbbell', 'Coffee', 'Plane', 'Gift', 'Smartphone', 'Shirt', 'Globe',
  'Star', 'DollarSign', 'CreditCard', 'PiggyBank',
] as const;

export const AVAILABLE_COLORS = [
  '#EF4444', '#F97316', '#F59E0B', '#EAB308', '#84CC16', '#22C55E',
  '#10B981', '#14B8A6', '#06B6D4', '#3B82F6', '#6366F1', '#8B5CF6',
  '#A855F7', '#EC4899', '#F43F5E', '#6B7280',
];
