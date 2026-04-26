import { Briefcase, CheckCircle2, TrendingUp } from 'lucide-react';
import ImageTabs from '@/components/image-tabs';
import HomeCtaBtn from '@/components/home-cta-btn';
import { getSession } from '@/lib/auth/helper-functions';
import { Suspense } from 'react';

const features = [
  {
    icon: Briefcase,
    title: 'Organize Applications',
    description:
      'Create custom boards and columns to track your job applications at every stage of the process.',
  },
  {
    icon: CheckCircle2,
    title: 'Track Progress',
    description:
      'Monitor your application status from applied to interview to offer with visual Kanban boards.',
  },
  {
    icon: TrendingUp,
    title: 'Stay Organized',
    description:
      'Never lose track of an application. Keep all your job search information in one centralized place.',
  },
];

export default async function Home() {
  const session = await getSession();

  return (
    <div className="flex flex-1 flex-col bg-white">
      <main className="flex-1">
        {/* Hero Section */}
        <section className="container mx-auto px-4 py-8 lg:py-16">
          <div className="mx-auto max-w-4xl text-center">
            <h1 className="mb-6 text-5xl font-bold sm:text-6xl">
              A better way to track your job applications.
            </h1>
            <p className="text-muted-foreground mb-10 text-xl">
              Capture, organize, and manage your job search in one place.
            </p>
            <div className="flex flex-col items-center gap-4">
              <Suspense fallback={<span>Loading...</span>}>
                <HomeCtaBtn isLoggedIn={session != null} />
              </Suspense>
              <p className="text-muted-foreground text-sm">
                Free forever. No credit card required.
              </p>
            </div>
          </div>
        </section>

        {/* Hero Images Section with Tabs */}
        <ImageTabs />

        {/* Features Section */}
        <section className="border-t bg-white py-16">
          <div className="container mx-auto px-4">
            <div className="grid gap-12 md:grid-cols-3">
              {features.map((feature, index) => (
                <div key={`feature-${index}`} className="flex flex-col">
                  <div className="bg-primary/10 mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg">
                    <feature.icon className="text-primary h-6 w-6" />
                  </div>
                  <h3 className="mb-3 text-2xl font-semibold text-black">
                    {feature.title}
                  </h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
