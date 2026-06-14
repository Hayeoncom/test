const target = '/photography/2019-hongkong/';

export function GET() {
  return new Response(`<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>HONG KONG</title>
    <link rel="canonical" href="${target}">
    <meta http-equiv="refresh" content="0; url=${target}">
    <script>window.location.replace("${target}");</script>
  </head>
  <body>
    <p>This page has moved to <a href="${target}">${target}</a>.</p>
  </body>
</html>
`, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8'
    }
  });
}
