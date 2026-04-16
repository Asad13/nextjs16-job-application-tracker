'use client';

import { useTransition, useState, Suspense } from 'react';
import Image from 'next/image';
import { Button } from './ui/button';
import { cn } from '@/lib/utils';

const tabs = [
  {
    id: 'tab1',
    imgSrc: '/images/hero-images/hero1.png',
    title: 'Organize Applications',
  },
  {
    id: 'tab2',
    imgSrc: '/images/hero-images/hero2.png',
    title: 'Get Hired',
  },
  {
    id: 'tab3',
    imgSrc: '/images/hero-images/hero3.png',
    title: 'Manage Boards',
  },
];

type TabId = (typeof tabs)[number]['id'];

const ImageTabs = () => {
  const [isPending, startTransition] = useTransition();
  const [curentTab, setCurrentTab] = useState<TabId>(tabs[0].id);

  const changeTab = (newTab: TabId) => {
    startTransition(() => {
      setCurrentTab(newTab);
    });
  };

  const activeTab = tabs.find((tab) => tab.id === curentTab)!;

  return (
    <section className="container mx-auto mb-16 px-4">
      <div className="mx-auto mb-4 flex items-center justify-center gap-2">
        {tabs.map((tab) => (
          <Button
            key={tab.id}
            role="tab"
            id={`tab-${tab.id}`}
            aria-selected={curentTab === tab.id}
            aria-controls={`panel-${tab.id}`}
            onClick={() => {
              if (curentTab !== tab.id) {
                changeTab(tab.id);
              }
            }}
            className={cn(
              'rounded-lg px-6 py-3 text-sm font-medium transition-colors',
              {
                'bg-primary pointer-events-none text-white':
                  curentTab === tab.id,
                'cursor-pointer bg-gray-100 text-gray-700 hover:bg-gray-200':
                  curentTab !== tab.id,
              },
            )}
          >
            {tab.title}
          </Button>
        ))}
      </div>
      <div>
        <Suspense fallback={<span>Loading...</span>}>
          <div
            role="tabpanel"
            id={`panel-${activeTab.id}`}
            aria-labelledby={activeTab.id}
            className={cn(
              'relative mx-auto h-150 w-full max-w-300 overflow-hidden rounded-lg border border-gray-200 shadow-xl',
              { 'opacity-80': isPending },
            )}
          >
            <Image
              src={activeTab.imgSrc}
              alt={activeTab.title}
              width={1200}
              height={600}
              loading={activeTab.id === tabs[0].id ? 'eager' : 'lazy'}
              decoding={activeTab.id === tabs[0].id ? 'sync' : 'async'}
              className="h-auto w-full rounded-lg object-cover"
            />
          </div>
        </Suspense>
      </div>
    </section>
  );
};

export default ImageTabs;
