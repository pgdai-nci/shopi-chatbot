let products = [];

export async function loadProducts() {
  try {
    const res = await fetch('data/products.json');
    const data = await res.json();
    products = data.products || [];
    return products;
  } catch (e) {
    console.error('Failed to load products:', e);
    return [];
  }
}

export function searchProducts(query) {
  const words = query.toLowerCase().split(/\s+/).filter(w => w.length > 2);
  if (words.length === 0) return products.slice(0, 4);

  return products
    .map(p => ({
      ...p,
      score: words.reduce((sum, word) => {
        const text = `${p.title} ${p.description} ${p.tags.join(' ')}`.toLowerCase();
        return sum + (text.includes(word) ? 1 : 0);
      }, 0)
    }))
    .filter(p => p.score > 0)
    .sort((a, b) => b.score - a.score);
}
