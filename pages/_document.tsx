import { Html, Head, Main, NextScript } from 'next/document'

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" />
      </Head>
      <body className="bg-white dark:bg-gray-900 transition-colors duration-300">
        <Main />
        <NextScript />
      </body>
    </Html>
  )
}