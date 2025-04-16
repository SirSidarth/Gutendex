const readline = require('readline/promises');
const { stdin: input, stdout: output } = require('process');

const rl = readline.createInterface({ input, output });
const BASE_URL = 'https://gutendex.com/books?search=';

async function bookSearch() {
  const query = await rl.question("Search title/author: ");
  try {
    const res = await fetch(BASE_URL + encodeURIComponent(query.trim()));
    const data = await res.json();
    return data.results;
  } catch (err) {
    console.error("Error fetching books:", err.message);
    return [];
  }
}

// function to get the id of the book from the user and fetch the text/plain format from the formats available of the book
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
// function to display the book that the user selected with the options to either go next, previous, or quit
async function readBook(text, pageSize = 1500) {
  const pages = [];
  for (let i = 0; i < text.length; i += pageSize) {
    pages.push(text.slice(i, i + pageSize));
  }
  let currentPage = 0;
  while (true) {
    console.clear();
    console.log(`\n--- Page ${currentPage + 1} of ${pages.length} ---\n`);
    console.log(pages[currentPage]);
    console.log("\n next | prev | quit");

    const command = await rl.question("enter the choice: ");
    if (command === 'next' && currentPage < pages.length - 1) {
      currentPage++;
    } else if (command === 'prev' && currentPage > 0) {
      currentPage--;
    } else if (command === 'quit') {
      break;
    }
  }
}
// function that prompts the user to input entries, fetch the result based on the entry and display the content
async function menu() {
  console.log("\n Welcome to Gutenberg");
  const results = await bookSearch();
  if (results.length === 0) {
    console.log("No results found.");
    return await menu();
  }
  console.log("\nSearch Results:");
  results.slice(0, 10).forEach((book, index) => {
    const authors = book.authors.map(a => a.name).join(', ') || "Unknown Author";
    console.log(`${index + 1}. ${book.title} by ${authors}`);
  });

  const choice = await rl.question("\nSelect book number or 0 to go back: ");
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