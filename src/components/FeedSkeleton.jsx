const FeedSkeleton = () => (
  <div className="feed-loading">
    {[1, 2, 3].map(i => (
      <div key={i} className="skeleton-post">
        <div className="sk-header">
          <div className="sk-avatar" />
          <div className="sk-lines">
            <div className="sk-line w50" />
            <div className="sk-line w30" />
          </div>
        </div>
        <div className="sk-line w100" />
        <div className="sk-line w80" />
      </div>
    ))}
  </div>
);

export default FeedSkeleton;
