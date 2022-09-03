import type { LoaderFunction, MetaFunction } from '@remix-run/node';
import {
  Links,
  LiveReload,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useLoaderData,
  useLocation,
} from '@remix-run/react';
import { NavBar } from './components/NavBar';
import app from './styles/app.css';
import tailwind from './styles/tailwind.css';
import type { User } from './types/user';
import { db } from './utils/db.server';
import { getUserId } from './utils/session.server';

export function links() {
  return [
    { rel: 'stylesheet', href: tailwind },
    { rel: 'stylesheet', href: app },
  ];
}
export const meta: MetaFunction = () => ({
  charset: 'utf-8',
  title: 'Ayaz Memster',
  viewport: 'width=device-width,initial-scale=1',
});

type LoaderData = {
  user?: User;
};

export const loader: LoaderFunction = async ({ request }) => {
  const userId = await getUserId(request);
  if (!userId) {
    return { user: undefined };
  }

  const user = await db.user.findUnique({
    where: { id: userId },
    select: { username: true, canEdit: true, canAccess: true, isAdmin: true },
  });
  if (!user) {
    return { user: undefined };
  }
  let role: User['role'] = 'unknown';
  if (user.isAdmin) {
    role = 'admin';
  } else if (user.canEdit) {
    role = 'editor';
  } else if (user.canAccess) {
    role = 'viewer';
  }
  return { user: { username: user.username, role } };
};

export default function App() {
  const { user } = useLoaderData<LoaderData>();
  const location = useLocation();

  return (
    <html lang="en" className="font-sans h-full">
      <head>
        <Meta />
        <Links />
      </head>
      <body className="h-full flex flex-col">
        <NavBar user={user} />
        <main className="flex-grow">
          {user === undefined && location.pathname !== '/login' ? (
            <div>Not logged in :(</div>
          ) : (
            <Outlet />
          )}
        </main>
        <ScrollRestoration />
        <Scripts />
        <LiveReload />
      </body>
    </html>
  );
}
