import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth/helper-functions';
import { getDefaultBoard } from '@/actions/board';
import KanbanBoard from '@/components/kanban-board';
import NewUserWelcomeMsg from '@/components/new-user-welcome-msg';

const Dashboard = async () => {
  const session = await getSession();
  if (!session || !session.user) {
    redirect('/auth/signin');
  }

  const board = await getDefaultBoard(session.user.id);

  return (
    <div className="flex-1">
      {session.user.isNewUser && <NewUserWelcomeMsg />}
      <div className="container mx-auto p-4 sm:p-6">
        {board ? (
          <>
            <div className="mb-4 px-4 sm:mb-6">
              <h2 className="text-2xl font-bold text-black md:text-3xl">
                {board.name}
              </h2>
              <p className="text-gray-600">{board.description}</p>
            </div>
            <Suspense fallback={<p>Loading default board...</p>}>
              <KanbanBoard key={`${new Date().getTime()}`} board={board} />
            </Suspense>
          </>
        ) : (
          <p className="px-4 py-6 text-center">No board found...</p>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
