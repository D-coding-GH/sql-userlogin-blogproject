const express = require("express");
const mysql = require("mysql");
const path = require('path')
const app = express();
const hbs = require('hbs');


const db = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "root", 
    port: 8889,
    database: "first database",

});

db.connect((error) => {
    if (error) {
        console.log(error)
    } else {
        console.log("mySQL connected")
    }
});

app.use(express.urlencoded({ extended: false }))
app.use(express.json())

const viewsPath = path.join(__dirname, '/views')

const partialPath = path.join(__dirname, '/views/incParsels')

hbs.registerPartials(partialPath)

const publicDirectory = path.join(__dirname, '/public');
app.use(express.static(publicDirectory));



app.set('view engine', 'hbs');

app.set('views', viewsPath);


app.get('/index', (req, res) => {
    res.render('index');
});

app.post('/registerUser', (req, res) => {

    const name = req.body.userName;
    const age = req.body.userAge;
    const location = req.body.userLocation;
    const email = req.body.userEmail

    db.query('INSERT INTO users SET ?',
        { name: name, age: age, location: location, email: email }, (error, results) => {
            if (error) {
                res.send("theres an error")
            } else {
                res.send('the user has been registered')
            }
        })
});

app.get('/userSelect', (req, res)=>{
    db.query("SELECT * FROM users", (error, results) => {
             
        
        res.render('userSelect', {
            users: results
        });
     });
  
});



app.get('/update/:id', (req, res,) => {

    const user = req.params.id;
db.query('SELECT * FROM users WHERE id=?', [user],(error, results) =>{
    if(!error){
        
         res.render("updateUser", {userId:user, name: results[0].name, age: results[0].age, location: results[0].location, email: results[0].email})
    }
})

   
})




app.post('/updated/:userId', (req, res,) => {

    
    const name = req.body.userName;
    console.log(name)
    const age = req.body.userAge;
    console.log(age)
    const location = req.body.userLocation;
    console.log(location)
    const email = req.body.userEmail;
    console.log(email)

    const id = req.params.userId;
    console.log(id)

    const query = 'UPDATE users SET name = ?, age = ?, location = ?, email = ?  WHERE id = ?';

    let user = [name, age, location, email, id];

    db.query( query, user, (error, results) => {

        if (error) {
            console.log(error)
            res.send("There was an error")
        } else {
            console.log(results)
            res.send('user updated')
        }
    })
})


app.get('/userInformation', (req, res) =>{
    res.render('userInformation');
})


app.post('/userInfo:userId', (req, res) => {


    const user = req.params.userId

    db.query('SELECT * FROM users WHERE id=?',

        [user], (error, results) => {

            if (error) {
                console.log(error)
                res.send("theres an error")
            } else {
                console.log(results)
                res.render('userInformation', { userId:user, name: results[0].name, age: results[0].age, location: results[0].location, email: results[0].email })
            }
        })
});

app.get('/userBlogs', (req, res) =>{
    res.render('userBlogs');
})


app.get('/viewblogs/:userId', (req,res) =>{

    const id = req.params.userId
    console.log(id)
    const user = [id]
    console.log(user)

    db.query('SELECT a.*, b.name FROM blog_posts a INNER join users b on a.users_id = b.id WHERE users_id = ?',

    user, (error, results) => {

        if (error) {//.......need to be styled into a list format
            console.log(error)
            res.send("theres an error")
        } else {
            console.log(results)

            res.render('userBlogs', { blogs:results})
            
        }
    })
});


app.get('/createBlog/:userId', (req, res) =>{
    const id = req.params.userId;
    res.render('createBlog',{userId:id});
})



app.post('/createBlog/:userId', (req, res) => {

    const id = req.params.userId;
    console.log(id);
    

    const title = req.body.title
    console.log(title)
    const body = req.body.body
    console.log(body)
    

db.query( 'INSERT INTO blog_posts SET ?', { title: title, body: body, users_id: id } ,(error, results) => {

         if (error) {
            console.log(error)
            res.send("theres an error")
        } else {
            console.log(results)
            res.send('blog updated')
        }
    })
});



app.get('/deletePage', (req, res) => {
    res.render('deletePage');
});


app.post("/deleteuser/:id", (req, res) => {

    const id = req.params.id;
    console.log(id)
    let query = 'DELETE FROM users WHERE id= ?';
    let user = [id];


    db.query(query, user, (error, results) => {
        if (error) {
            res.send("there was an error")
        } else {
            res.render("deletePage")
        }
    })

})



app.listen(5000, () => {
    console.log("server started on port 5000")
});


