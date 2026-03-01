// import { POSTS } from '../constants/posts';
//
// export function LastPost() {
//   // Берём самый последний пост из массива (индекс 0),
//   // вместо того чтобы крутить рандом каждые 2 часа
//   const post = POSTS[0];
//
//   if (!post) return null;
//
//   return (
//     <div
//       style={{
//         padding: '24px',
//         background: 'var(--surface)',
//         border: '1px solid var(--border)',
//         position: 'relative',
//         transition: 'all 0.3s ease',
//       }}
//     >
//       {/* Метка статуса вместо лога */}
//       <div
//         style={{
//           fontFamily: 'var(--font-mono)',
//           fontSize: '10px',
//           color: 'var(--green)',
//           textTransform: 'uppercase',
//           letterSpacing: '0.15em',
//           marginBottom: '16px',
//           display: 'flex',
//           alignItems: 'center',
//           gap: '8px',
//         }}
//       >
//         <span
//           style={{
//             width: '6px',
//             height: '6px',
//             borderRadius: '50%',
//             background: 'var(--green)',
//             boxShadow: '0 0 8px var(--green)',
//           }}
//         />
//         Última Señal Detectada
//       </div>
//
//       <div
//         style={{
//           fontFamily: 'var(--font-display)',
//           fontSize: '16px',
//           fontWeight: 800,
//           color: 'var(--text)',
//           marginBottom: '12px',
//           lineHeight: 1.3,
//         }}
//       >
//         {post.title}
//       </div>
//
//       <div
//         style={{
//           fontFamily: 'var(--font-mono)',
//           fontSize: '11px',
//           color: 'var(--text-dim)',
//           lineHeight: 1.6,
//           marginBottom: '16px',
//         }}
//       >
//         {post.text}
//       </div>
//
//       <div
//         style={{
//           display: 'flex',
//           justifyContent: 'space-between',
//           alignItems: 'center',
//           paddingTop: '12px',
//           borderTop: '1px solid var(--border-subtle)',
//         }}
//       >
//         <div
//           style={{
//             fontFamily: 'var(--font-mono)',
//             fontSize: '10px',
//             color: post.sentiment.includes('Bullish') ? 'var(--green)' : '#ff4444',
//           }}
//         >
//           {post.sentiment}
//         </div>
//         <div
//           style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--text-muted)' }}
//         >
//           Source: <span style={{ color: 'var(--text)' }}>{post.source}</span>
//         </div>
//       </div>
//
//       {/* Декоративный уголок */}
//       <div
//         style={{
//           position: 'absolute',
//           top: '-1px',
//           right: '-1px',
//           width: '30px',
//           height: '30px',
//           background: 'linear-gradient(45deg, transparent 50%, var(--green) 50%)',
//           opacity: 0.2,
//           clipPath: 'polygon(100% 0, 100% 100%, 0 0)',
//         }}
//       />
//     </div>
//   );
// }
