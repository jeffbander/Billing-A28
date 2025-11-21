import { COOKIE_NAME } from "../../shared/const";

export const config = {
  runtime: 'nodejs20.x',
};

export default async function handler(request: Request): Promise<Response> {
  if (request.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // Determine if we're in a secure context
  const host = request.headers.get("host") || "";
  const isSecure = process.env.NODE_ENV === "production" || host.includes("vercel.app");

  // Build cookie options to clear the session
  const cookieOptions = [
    `${COOKIE_NAME}=`,
    `Max-Age=0`,
    `Path=/`,
    `HttpOnly`,
    `SameSite=Lax`,
  ];

  if (isSecure) {
    cookieOptions.push("Secure");
  }

  return new Response(
    JSON.stringify({ success: true }),
    {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Set-Cookie': cookieOptions.join('; '),
      },
    }
  );
}
