import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useTheme } from '../context/ThemeContext';
import '../css/Gallery.css';

function Gallery() {
  const { theme } = useTheme();
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fallback images if API lacks good ones
  const fallbackImages = [
    'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2f/Conor_McGregor_2018.jpg/320px-Conor_McGregor_2018.jpg',
    'https://upload.wikimedia.org/wikipedia/commons/thumb/7/76/Jared_Cannonier_UFC_230_%28cropped%29.jpg/320px-Jared_Cannonier_UFC_230_%28cropped%29.jpg',
    'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c0/Francis_Ngannou_UFC_220.jpg/320px-Francis_Ngannou_UFC_220.jpg',
  ];

  useEffect(() => {
    const fetchNews = async () => {
      try {
        const response = await axios.get('https://newsapi.org/v2/everything', {
          params: {
            q: 'MMA OR UFC', // Search for MMA or UFC news
            apiKey: 'b97053ed922a4b5da1bc426e6f469a5d', // Replace with your NewsAPI key
            language: 'en', // English articles
            sortBy: 'publishedAt', // Most recent first
            pageSize: 10, // Fetch 6 articles
          },
        });
        // Map articles with sizes and fallback images
        const fetchedArticles = response.data.articles.map((article, index) => ({
          id: index + 1,
          title: article.title,
          summary: article.description || 'No summary available',
          date: new Date(article.publishedAt).toLocaleDateString(),
          image: article.urlToImage || fallbackImages[index % fallbackImages.length],
          size: index % 2 === 0 ? 'big' : 'small', // Alternate big/small
        }));
        setArticles(fetchedArticles);
        setLoading(false);
      } catch (err) {
        setError('Failed to fetch news—check API key or network.');
        setLoading(false);
      }
    };
    fetchNews();
  }, []);

  if (loading) return <div className={`Gallery ${theme}`}><p>Loading news...</p></div>;
  if (error) return <div className={`Gallery ${theme}`}><p>{error}</p></div>;

  return (
    <section className={`Gallery ${theme}`}>
      <h2>MMA Highlights</h2>
      <div className="gallery-list">
        {articles.map((item) => (
          <article
            key={item.id}
            className={`gallery-item ${item.size === 'big' ? 'big-frame' : 'small-frame'}`}
            style={{ backgroundImage: `url(${item.image})` }}
          >
            <div className="content">
              <h3>{item.title}</h3>
              <p>{item.summary}</p>
              <span>{item.date}</span>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

export default Gallery;