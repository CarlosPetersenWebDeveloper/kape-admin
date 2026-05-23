import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

type CookieToSet = { name: string; value: string; options: CookieOptions };

/** Refresca la sesión de Supabase en cada request y protege rutas. */
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: CookieToSet[]) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // Refresh: lee el usuario y refresca el token si hace falta
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const url = request.nextUrl.clone();
  const isLogin = url.pathname.startsWith('/login');

  // Rutas protegidas: si no hay user, mandar a /login
  if (!user && !isLogin) {
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  // Si ya está logueado y va a /login, mandarlo al dashboard
  if (user && isLogin) {
    url.pathname = '/';
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
