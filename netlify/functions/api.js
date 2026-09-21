// Netlify Function test endpoint.
export default async function () {
  return new Response(
    JSON.stringify({
      ok: true,
      message: "SkyCast Netlify Function is working"
    }),
    {
      status: 200,
      headers: {
        "Content-Type": "application/json"
      }
    }
  );
}