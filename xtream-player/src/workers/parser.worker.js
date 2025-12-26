// Web Worker for parsing large API responses
self.onmessage = function(e) {
  const { action, data } = e.data;
  
  try {
    let result = null;
    
    if (action === 'parseChannels') {
      result = data.map(ch => ({
        channel_id: ch.stream_id,
        name: ch.name,
        category_id: ch.category_id,
        logo: ch.stream_icon || '',
        epg_channel_id: ch.epg_channel_id || '',
        added: ch.added || 0,
        is_adult: ch.is_adult === 1,
        category_name: ch.category_name || ''
      }));
    } else if (action === 'parseMovies') {
      result = data.map(m => ({
        id: m.stream_id,
        name: m.name,
        category_id: m.category_id,
        poster: m.stream_icon || '',
        description: m.name || '',
        duration: 0,
        rating: 0,
        year: 0,
        added: m.added || 0,
        is_adult: m.is_adult === 1
      }));
    } else if (action === 'searchItems') {
      const { items, query } = data;
      const q = query.toLowerCase();
      result = items.filter(item => {
        const text = (item.name + ' ' + (item.category_name || '')).toLowerCase();
        return text.includes(q);
      }).slice(0, CONFIG.SEARCH_MAX_RESULTS);
    } else if (action === 'groupByCategory') {
      result = {};
      data.forEach(item => {
        const cat = item.category_id || 'uncategorized';
        if (!result[cat]) result[cat] = [];
        result[cat].push(item);
      });
    }
    
    self.postMessage({ success: true, result });
  } catch (err) {
    self.postMessage({ success: false, error: err.message });
  }
};
