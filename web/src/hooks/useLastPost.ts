import { useEffect, useState } from 'react';

interface LastPost {
  text: string;
  date: number;
}

export function useLastPost() {
  const [post, setPost] = useState<LastPost | null>(null);

  useEffect(() => {
    fetch('/api/last-post')
      .then((res) => res.json())
      .then((data) => {
        if (data.text) setPost(data);
      })
      .catch(console.error);
  }, []);

  return post;
}
