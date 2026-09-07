import React from 'react';
import { ArrowRight } from 'lucide-react';
import type { NewsItem } from '../../types';

interface NewsSectionProps {
  onReadMore?: (news: NewsItem) => void;
}

const newsData: NewsItem[] = [
  {
    id: 'news-1',
    title: 'Tin tức A',
    summary:
      'lorem ipsum dolor sit amet consectetuer adipiscing elit sed diam nonummy nibh euismod tincidunt ut...',
    image:
      'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&w=600&q=80',
    date: '05/09/2026',
    category: 'Chăm sóc da',
  },
  {
    id: 'news-2',
    title: 'Tin tức A',
    summary:
      'lorem ipsum dolor sit amet consectetuer adipiscing elit sed...',
    image:
      'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=600&q=80',
    date: '04/09/2026',
    category: 'Y tế',
  },
  {
    id: 'news-3',
    title: 'Tin tức A',
    summary:
      'lorem ipsum dolor sit amet consectetuer adipiscing elit sed...',
    image:
      'https://images.unsplash.com/photo-1505751172876-fa1923c5c528?auto=format&fit=crop&w=600&q=80',
    date: '03/09/2026',
    category: 'Điều trị',
  },
  {
    id: 'news-4',
    title: 'Tin tức A',
    summary:
      'lorem ipsum dolor sit amet consectetuer adipiscing elit...',
    image:
      'https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?auto=format&fit=crop&w=600&q=80',
    date: '02/09/2026',
    category: 'Lời khuyên',
  },
  {
    id: 'news-5',
    title: 'Tin tức A',
    summary:
      'lorem ipsum dolor sit amet consectetuer adipiscing elit sed...',
    image:
      'https://images.unsplash.com/photo-1584467735815-f778f274e296?auto=format&fit=crop&w=600&q=80',
    date: '01/09/2026',
    category: 'Phòng ngừa',
  },
  {
    id: 'news-6',
    title: 'Tin tức A',
    summary:
      'lorem ipsum dolor sit amet consectetuer adipiscing elit sed...',
    image:
      'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=600&q=80',
    date: '31/08/2026',
    category: 'Dược phẩm',
  },
];

export const NewsSection: React.FC<NewsSectionProps> = ({ onReadMore }) => {
  return (
    <section id="news" className="news-section">
      <div className="container news-container">
        {/* Section Heading */}
        <div className="section-header-centered">
          <h2 className="section-main-title">Một vài tin tức y tế hot</h2>
          <p className="section-main-subtitle">Cập nhập những tin tức mới nhất về y tế</p>
        </div>

        {/* 3-Column 2-Row News Grid matching Figma */}
        <div className="news-layout-grid">
          {/* Column 1 */}
          <div className="news-col">
            {/* Card 1 */}
            <article className="news-card" onClick={() => onReadMore?.(newsData[0])}>
              <div className="news-img-box">
                <img
                  src={newsData[0].image}
                  alt={newsData[0].title}
                  className="news-img"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src =
                      'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&w=600&q=80';
                  }}
                />
              </div>
              <div className="news-content">
                <h3 className="news-title">{newsData[0].title}</h3>
                <p className="news-summary">{newsData[0].summary}</p>
                <div className="news-readmore">
                  <span>Đọc thêm</span>
                  <ArrowRight size={16} />
                </div>
              </div>
            </article>

            {/* Card 4 (Bottom of Col 1) */}
            <article className="news-card" onClick={() => onReadMore?.(newsData[3])}>
              <div className="news-img-box">
                <img
                  src={newsData[3].image}
                  alt={newsData[3].title}
                  className="news-img"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src =
                      'https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?auto=format&fit=crop&w=600&q=80';
                  }}
                />
              </div>
              <div className="news-content">
                <p className="news-summary">{newsData[3].summary}</p>
                <div className="news-readmore">
                  <span>Đọc thêm</span>
                  <ArrowRight size={16} />
                </div>
              </div>
            </article>
          </div>

          {/* Column 2 */}
          <div className="news-col">
            {/* Card 2 */}
            <article className="news-card" onClick={() => onReadMore?.(newsData[1])}>
              <div className="news-img-box">
                <img
                  src={newsData[1].image}
                  alt={newsData[1].title}
                  className="news-img"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src =
                      'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=600&q=80';
                  }}
                />
              </div>
              <div className="news-content">
                <h3 className="news-title">{newsData[1].title}</h3>
                <p className="news-summary">{newsData[1].summary}</p>
                <div className="news-readmore">
                  <span>Đọc thêm</span>
                  <ArrowRight size={16} />
                </div>
              </div>
            </article>

            {/* Card 5 */}
            <article className="news-card" onClick={() => onReadMore?.(newsData[4])}>
              <div className="news-img-box">
                <img
                  src={newsData[4].image}
                  alt={newsData[4].title}
                  className="news-img"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src =
                      'https://images.unsplash.com/photo-1584467735815-f778f274e296?auto=format&fit=crop&w=600&q=80';
                  }}
                />
              </div>
              <div className="news-content">
                <h3 className="news-title">{newsData[4].title}</h3>
                <p className="news-summary">{newsData[4].summary}</p>
                <div className="news-readmore">
                  <span>Đọc thêm</span>
                  <ArrowRight size={16} />
                </div>
              </div>
            </article>
          </div>

          {/* Column 3 */}
          <div className="news-col">
            {/* Card 3 */}
            <article className="news-card" onClick={() => onReadMore?.(newsData[2])}>
              <div className="news-img-box">
                <img
                  src={newsData[2].image}
                  alt={newsData[2].title}
                  className="news-img"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src =
                      'https://images.unsplash.com/photo-1505751172876-fa1923c5c528?auto=format&fit=crop&w=600&q=80';
                  }}
                />
              </div>
              <div className="news-content">
                <h3 className="news-title">{newsData[2].title}</h3>
                <p className="news-summary">{newsData[2].summary}</p>
                <div className="news-readmore">
                  <span>Đọc thêm</span>
                  <ArrowRight size={16} />
                </div>
              </div>
            </article>

            {/* Card 6 */}
            <article className="news-card" onClick={() => onReadMore?.(newsData[5])}>
              <div className="news-img-box">
                <img
                  src={newsData[5].image}
                  alt={newsData[5].title}
                  className="news-img"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src =
                      'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=600&q=80';
                  }}
                />
              </div>
              <div className="news-content">
                <h3 className="news-title">{newsData[5].title}</h3>
                <p className="news-summary">{newsData[5].summary}</p>
                <div className="news-readmore">
                  <span>Đọc thêm</span>
                  <ArrowRight size={16} />
                </div>
              </div>
            </article>
          </div>
        </div>
      </div>
    </section>
  );
};
