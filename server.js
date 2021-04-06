'use strict'
// env data
require('dotenv').config();

//---------------------- Env var -------------------------------
const PORT = process.env.PORT;
//------------------------------------------------------------

// connection
const express =require('express');
const cors =require('cors');
const superagent =require('superagent');

const app = express();
app.use(cors());

// Application Middleware
app.use(express.urlencoded());
// Set the view engine for server-side templating
app.set('view engine', 'ejs');

//-Port for make public directory available for user | for css files
app.use(express.static(__dirname + '/public'));
//------------------------------------------------------------

// https://www.googleapis.com/books/v1/volumes?
// intitle --- inauthor
// https://www.googleapis.com/books/v1/volumes?q=flowers+inauthor
// https://www.googleapis.com/books/v1/volumes?q=flowers+inauthor

// Creates a new search to the Google Books API
app.post('/searches', createSearch);

app.get('/test',(req,res)=>{
    res.render('pages/searches/new.ejs');
});


app.get('*',nothing);
function nothing (req,res){
    res.status(404).send('you sent Invalid request!!');
}

app.listen(PORT,()=>{
    console.log('connect/');
});

// --------- Functions ---------
let book_details =[];
function createSearch(req,res){
    
    const search = req.body.search_text;
    const types = req.body.radio || 'intitle';
    const url = `https://www.googleapis.com/books/v1/volumes?q=${search}+${types}`;

    superagent.get(url).then(result=>{
        
        book_details = [];
        for(let i=0;i<10;i++){
            book_details.push(new Books(result.body.items[i]));
        }
        res.render('pages/searches/show.ejs', { searchResults: book_details });
    }).catch(err=>{
        res.render('pages/error.ejs', { error: err });
    });

    
}

// *********** Constructor ************

function Books (data){
    this.title = data.volumeInfo.title ? data.volumeInfo.title : '';
    this.description = data.description ? data.description : '';
    this.author = data.volumeInfo.authors ? data.volumeInfo.authors.join(" - ") : '';
    this.image = data.volumeInfo.imageLinks.thumbnail ? data.volumeInfo.imageLinks.thumbnail : 'default';  
}