const readline = require('readline/promises');
const { stdin: input, stdout: output } = require('process');

const rl = readline.createInterface({ input, output });
const BASE_URL = 'https://gutendex.com/books?search=';

async function prompt(query) {
  return await rl.question(query);
}

async function bookSearch(query) {
  try {
    const res = await fetch(BASE_URL + encodeURIComponent(query));
    const data = await res.json();
    return data.results;
  } catch (err) {
    console.error("Error fetching books:", err.message);
    return [];
  }
}

async function fetchBook(bookId) {
  try {
    const res = await fetch(`https://gutendex.com/books/${bookId}`);
    const data = await res.json();
    const formats = data.formats;

    const textUrl = Object.entries(formats).find(([key, value]) =>
      key.startsWith('text/plain') && typeof value === 'string')?.[1];
    if (!textUrl) {
      console.log("Plain text format not available.");
      return;
    }

    const bookRes = await fetch(textUrl);
    const text = await bookRes.text();

    await readBook(text);
  } catch (err) {
    console.error("Error fetching book text:", err.message);
  }
}

async function readBook(text, pageSize = 1000) {
  const pages = [];
  for (let i = 0; i < text.length; i += pageSize) {
    pages.push(text.slice(i, i + pageSize));
  }
  let currentPage = 0;
  while (true) {
    console.clear();
    console.log(`\n--- Page ${currentPage + 1} of ${pages.length} ---\n`);
    console.log(pages[currentPage]);
    console.log("\n[n] Next | [p] Prev | [q] Quit");

    const command = await prompt("Command: ");
    if (command === 'n' && currentPage < pages.length - 1) {
      currentPage++;
    } else if (command === 'p' && currentPage > 0) {
      currentPage--;
    } else if (command === 'q') {
      break;
    }
  }
}

async function menu() {
  console.log("\n Welcome to Gutenberg");
  const query = await prompt("Search title/author: ");
  const results = await bookSearch(query);
  if (results.length === 0) {
    console.log("No results found.");
    return await menu();
  }
  console.log("\nSearch Results:");
  results.slice(0, 10).forEach((book, index) => {
    const authors = book.authors.map(a => a.name).join(', ') || "Unknown Author";
    console.log(`${index + 1}. ${book.title} by ${authors}`);
  });

  const choice = await prompt("\nSelect book number or 0 to go back): ");
  const index = parseInt(choice) - 1;
  if (index >= 0 && index < results.length) {
    const book = results[index];
    console.log(`\n Book you selected: ${book.title}`);
    await fetchBook(book.id);
  } else {
    console.log("wromg selection. Returning back...");
  }

  await menu();
}

menu().then(() => rl.close());
