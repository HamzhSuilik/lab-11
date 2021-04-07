'use strict'
// env data
require('dotenv').config();

//---------------------- Env var -------------------------------
const PORT = process.env.PORT;
const DATABASE_URL = process.env.DATABASE_URL;
//------------------------------------------------------------

// connection
const express = require('express');
const cors = require('cors');
const superagent = require('superagent');
const pg = require('pg');
const { pipe } = require('superagent');
const client = new pg.Client(DATABASE_URL);

const app = express();
app.use(cors());

// Application Middleware
app.use(express.urlencoded());
// Set the view engine for server-side templating
app.set('view engine', 'ejs');

//-Port for make public directory available for user | for css files
app.use(express.static(__dirname + '/public'));
//------------------------------------------------------------


// Creates a new search to the Google Books API
app.post('/searches', createSearch);
app.post('/select',add_to_database);

app.get('/searches', (req, res) => {
    res.render('pages/searches/new.ejs');
});



app.get('/', (req, res) => {
    const sqlQuery = `SELECT * FROM saved_book;`;
    client.query(sqlQuery).then(result => {
        res.render('pages/index.ejs', { array: result.rows });
    }).catch(error => {
        res.render('pages/index.ejs', { text: error });
    })
});

let sql_data = [];
app.get('/homepage', (req, res) => {
    const sqlQuery = `SELECT * FROM saved_book;`;
    client.query(sqlQuery).then(result => {
        sql_data = result.rows;
        res.render('pages/index.ejs', { array: result.rows });
    }).catch(error => {
        res.render('pages/index.ejs', { text: error });
    })
});

app.get('/details', details_page);

app.get('*', nothing);
function nothing(req, res) {
    res.status(404).send('you sent Invalid request!!');
}

// --------- Functions ---------
function details_page(req, res) {
    const book_index = req.query.book_index;

    const sqlQuery = `SELECT * FROM saved_book;`;
    client.query(sqlQuery).then(result => {
        res.render('pages/books/detail.ejs', { book_index: book_index, array: result.rows });
    }).catch(error => {
        res.render('pages/index.ejs', { text: error });
    })


    
}
//***************************************


function add_to_database(req,res){
    const {title,description_book,author,image_book,isbn,shelf} = req.body;


    const sqlQuery = `INSERT INTO saved_book (title, description_book,author, image_book, isbn,shelf) 
    VALUES('${title}','${description_book}','${author}','${image_book}','${isbn}','${shelf}');`;
    client.query(sqlQuery).then(result => {
        // ------------------------


        const sqlQuery = `SELECT * FROM saved_book;`;
        client.query(sqlQuery).then(result => {
            const book_index = result.rows.length*1-1;
            res.render('pages/books/detail.ejs', { book_index: book_index, array: result.rows });
        }).catch(error => {
            res.render('pages/index.ejs', { text: error });
        })



        // -------------------------
    }).catch(error => {
        res.render('pages/error.ejs', { error: err });
    })
    
}

//***************************************
let book_details = [];
function createSearch(req, res) {

    const search = req.body.search_text;
    const types = req.body.radio || 'intitle';
    const url = `https://www.googleapis.com/books/v1/volumes?q=${search}+${types}`;

    superagent.get(url).then(result => {

        book_details = [];
        for (let i = 0; i < 10; i++) {
            book_details.push(new Books(result.body.items[i]));
        }
        res.render('pages/searches/show.ejs', { searchResults: book_details });
    }).catch(err => {
        res.render('pages/error.ejs', { error: err });
    });

}

// *********** Constructor ************

function Books(data) {
    this.title = data.volumeInfo.title ? data.volumeInfo.title : '';
    this.description = data.description ? data.description : '';
    this.author = data.volumeInfo.authors ? data.volumeInfo.authors.join(" - ") : '';
    this.image = data.volumeInfo.imageLinks.thumbnail ? data.volumeInfo.imageLinks.thumbnail : 'https://cdn.picpng.com/book/book-view-30965.png';
    this.isbn = data.isbn;
    this.shelf = data.shelf;
}

function Books2(data) {
    this.title = data.title;
    this.description = data.description_book;
    this.author = data.author;
    this.image = data.image_book;
    this.isbn = data.isbn;
    this.shelf = data.shelf;
}

// Listen to the port

client.connect().then(() => {
    app.listen(PORT, () => {
        console.log('connect/');
    });
});

