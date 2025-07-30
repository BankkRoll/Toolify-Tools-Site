'use client';

import { Button } from '@/components/ui/button';
import { GithubIcon } from 'lucide-react';
import { useEffect, useState } from 'react';

interface GitHubRepoData {
  stargazers_count: number;
  name: string;
  html_url: string;
}

interface GithubStarsButtonProps {
  text?: string;
}

export default function GithubStarsButton({ text }: GithubStarsButtonProps) {
  const [starCount, setStarCount] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const repoOwner = 'BankkRoll';
  const repoName = 'Toolify-Tools-Site';
  const repoUrl = `https://github.com/${repoOwner}/${repoName}`;

  useEffect(() => {
    const fetchStarCount = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const response = await fetch(`https://api.github.com/repos/${repoOwner}/${repoName}`, {
          headers: {
            Accept: 'application/vnd.github.v3+json',
          },
        });

        if (!response.ok) {
          throw new Error(`GitHub API error: ${response.status}`);
        }

        const data: GitHubRepoData = await response.json();
        setStarCount(data.stargazers_count);
      } catch (err) {
        console.error('Failed to fetch GitHub stars:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch stars');
      } finally {
        setIsLoading(false);
      }
    };

    fetchStarCount();
  }, []);

  const formatStarCount = (count: number): string => {
    if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}k`;
    }
    return count.toString();
  };

  const handleClick = () => {
    window.open(repoUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <a href={repoUrl} target='_blank' rel='noopener noreferrer'>
      <Button
        type='button'
        onClick={handleClick}
        className='group text-foreground ring-offset-background focus-visible:ring-ring relative inline-flex h-10 cursor-pointer items-center justify-center rounded-md border bg-background px-4 py-2 text-sm font-medium whitespace-nowrap transition-colors duration-200 hover:bg-accent focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50'
      >
        <div className='flex items-center'>
          <GithubIcon className='h-4 w-4' />
          <span className='ml-1 p-1 lg:inline'>{text || 'GitHub'}</span>
        </div>
        <div className='ml-2 flex items-center gap-1 text-sm md:flex'>
          <svg
            className='size-4 text-gray-500 transition-all duration-200 group-hover:text-yellow-300'
            data-slot='icon'
            aria-hidden='true'
            fill='currentColor'
            viewBox='0 0 24 24'
            xmlns='http://www.w3.org/2000/svg'
          >
            <path
              clipRule='evenodd'
              d='M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.006 5.404.434c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.434 2.082-5.005Z'
              fillRule='evenodd'
            ></path>
          </svg>
          <span className='font-display inline-block font-medium tracking-wider text-black tabular-nums dark:text-white'>
            {isLoading ? (
              <span className='animate-pulse'>...</span>
            ) : error ? (
              <span className='text-red-500'>Error</span>
            ) : starCount !== null ? (
              formatStarCount(starCount)
            ) : (
              '0'
            )}
          </span>
        </div>
      </Button>
    </a>
  );
}
