const express = require("express");
const mysql = require("mysql");
const dotenv = require('dotenv');
const path = require('path');
const hbs = require('hbs');
const bcrypt = require('bcryptjs')
const cookieParser = require('cookie-parser')
const jwt = require("jsonwebtoken")
let authenticated = false;


dotenv.config({ path: './.env' })

const app = express();

///........mySQL datavbase connection with dotenv protection

const db = mysql.createConnection({
    host: process.env.DATABASE_HOST,
    user: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    port: 8889,
    database: process.env.DATABASE,

});

db.connect((error) => {
    if (error) {
        console.log(error)
    } else {
        console.log("mySQL connected")
    }
});



app.use(express.urlencoded({ extended: false }))

app.use(express.json());
app.use(cookieParser());

const viewsPath = path.join(__dirname, '/views')

const partialPath = path.join(__dirname, '/views/incParsels')

hbs.registerPartials(partialPath)

const publicDirectory = path.join(__dirname, '/public');
app.use(express.static(publicDirectory));

app.set('view engine', 'hbs');

app.set('views', viewsPath);


//....Homepage route, database query created to pull random blog posts for viewing on the landing page

app.get('/', (req, res) => {

    db.query('SELECT * FROM blog_posts ORDER BY RAND() LIMIT 3', (error, results) => {

        if (error) {
            console.log
            res.send("there was an error")

        } else {


            res.render('homepage', {
                blogs: results,
                loggedIn: authenticated
            });

        }
    })

})

app.get('/register', (req, res) => {
    res.render('register');
});

//.........................Register user to the database, includeds hashed password

app.post('/registerUser', async (req, res) => {

    const name = req.body.userName;
    const age = req.body.userAge;
    const location = req.body.userLocation;
    const email = req.body.userEmail;
    const password = req.body.userPassword;
    const passwordConfirm = req.body.PasswordConfirm;

    let hashedPassword = await bcrypt.hash(password, 8)
    db.query(
        'SELECT email from users WHERE email = ?', [email],
        (error, results) => {
            if (results.length > 0) {
                const errorMessage = "ERROR EMAIL ALREADY EXISTS";
                console.log(error)

                res.render("register", {
                    errorMessage: errorMessage
                })


            } else if (password !== passwordConfirm) {
                const errorMessage = "ERROR PASSWORDS DO NOT MATCH";
                console.log(error)
                res.render('register', {
                    errorMessage: errorMessage
                })

            } else {
                db.query('INSERT INTO users SET ?',


                    { name: name, age: age, location: location, email: email, password: hashedPassword }, async (error, results) => {

                        if (error) {
                            console.log(error)
                            res.send("theres an error")
                        } else {
                            res.render("loginPage", {


                                loggedIn: authenticated,
                            })
                        }
                    })
            }
        })

    console.log(hashedPassword)
})




app.get('/loginPage', (req, res) => {
    res.render('loginPage');
});


//.........................User login route, jwt cookie created, renders profile page with user details
//.........................and extra liks to the nav bar


app.post('/userLogin', async (req, res) => {

    const email = req.body.userEmail;
    const password = req.body.userPassword;;
    db.query('SELECT * FROM users WHERE email =? ', [email], async (error, results) => {

        if(results.length >0){
            const comparision = await bcrypt.compare(password, results[0].password)
            if(comparision){
                authenticated = true;
                const id = results[0].id
                const token = jwt.sign({ id }, process.env.JWT_SECERT, {
                    expiresIn: process.env.JWT_EXPIRES_IN
                })
                console.log("the token is: " + token)
                const cookieOptions = {
                    expires: new Date(
                        Date.now() + process.env.JWT_COOKIE_EXPIRES * 24 * 60 * 60 * 1000
                    ),
                    httpOnly: true
                }
                res.cookie('jwt', token, cookieOptions);
                res.status(200).render("profile", {
                    userId: id,
                    name: results[0].name,
                    age: results[0].age,
                    location: results[0].location,
                    email: results[0].email,

                    loggedIn: authenticated,
                })
            }
            
            else{
                res.status(401).render('loginPage', {
                    message: "email or password incorrect",
                    loggedIn: authenticated,
                })
            }
          }
          else{
            res.status(401).render('loginPage', {
                message: "email or password incorrect",
                loggedIn: authenticated,
            })
          }
        }
       
  
 
)});
  
//.........................profile page route

app.get('/profile/:id', (req, res) => {

    const user = req.params.id;
    console.log(req.params.id)
    db.query('SELECT * FROM users WHERE id=?', [user], (error, results) => {

        console.log(results)
        if (!error) {
            console.log(error)
            res.render("profile", {

                userId: user,
                name: results[0].name,
                age: results[0].age,
                location: results[0].location,
                email: results[0].email,

                loggedIn: authenticated
            })

        }
    })
})

//.........................route to update user pages with all needed details across


app.get('/updateProfile/:id', (req, res,) => {

    const user = req.params.id;
    console.log(req.params.id)
    db.query('SELECT * FROM users WHERE id=?', [user], (error, results) => {

        console.log(results)
        if (!error) {
            console.log(error)
            res.render("updateDetails", {

                userId: user,
                name: results[0].name,
                age: results[0].age,
                location: results[0].location,
                email: results[0].email,

                loggedIn: authenticated
            })

        }
    })
})


//.........................update user details, check user emails does not already exist, creates hashed password


app.post('/updated/:userId', async (req, res,) => {


    const name = req.body.userName;
    console.log(name)
    const age = req.body.userAge;
    console.log(age)
    const location = req.body.userLocation;
    console.log(location)
    const email = req.body.userEmail;
    console.log(email)
    const password = req.body.userPassword;


    const id = req.params.userId;
    console.log(id)

    let hashedPassword = await bcrypt.hash(password, 8)

    console.log(hashedPassword)
    const query = 'UPDATE users SET name = ?, age = ?, location = ?, email = ?, password = ?  WHERE id = ?';

    let user = [name, age, location, email, hashedPassword, id];

    db.query("SELECT email from users WHERE email = ?", [email], (error, results) => {

        if (error) {
            console.log(error)
            res.send("There was an error")
        } else {

            if (user.find( user => user.email === email)) {

                const errorMessage = "ERROR EMAIL ALREADY EXISTS";
                console.log(error)

                res.render("updateDetails", {
                    
                    errorMessage: errorMessage,
                    loggedIn: authenticated
                })


            } else {

                db.query(query, user, (error, results) => {

                    if (error) {
                        console.log(error)
                        res.send("There was an error")
                    } else {
                        console.log(results)

                        const Message = "profile updated"

                        res.render("updatedetails", {

                            userId: id,
                            loggedIn: authenticated,
                            Message:Message
                        })
                    }
                })
            }


        }
    })
})



//.........................creat new blog post route direct to create new blog page

app.get('/createBlog/:userId', (req, res) => {
    const id = req.params.userId;

    res.render('createBlog', {
        userId: id,
        loggedIn: authenticated
    });
})

//.........................userblog create route adds to mySQL database 

app.post('/createBlog/:userId', (req, res) => {

    const id = req.params.userId;
    console.log(id);


    const title = req.body.title
    console.log(title)
    const body = req.body.body
    console.log(body)


    db.query('INSERT INTO blog_posts SET ?', { title: title, body: body, users_id: id }, (error, results) => {

        if (error) {
            console.log(error)
            res.send("theres an error")
        } else {
            const message = "blog updated"
            res.render("profile", {
                userId: id,
                name: results[0].name,
                age: results[0].age,
                location: results[0].location,
                email: results[0].email,

                loggedIn: authenticated,
                message: message,


            })
        }
    })
});

//.........................renders all users blogs to the page to view

app.get('/userBlogs/:userId', (req, res) => {

    const id = req.params.userId
    console.log(id)
    const user = [id]
    console.log(user)

    db.query('SELECT a.*, b.name FROM blog_posts a INNER join users b on a.users_id = b.id WHERE users_id = ?',

        user, (error, results) => {

            if (results.length > 0) {
                console.log(results)
                res.render('userBlogs', {
                    blogs: results,
                    loggedIn: authenticated
                });
            } else {

                console.log(error)
                res.send("theres an error")

            }
        })
});


//.........................delete users profile form database

app.post("/deleteuser/:id", (req, res) => {

    const id = req.params.id;
    console.log(id)
    let query = 'DELETE FROM users WHERE id= ?';
    let user = [id];


    db.query(query, user, (error, results) => {
        if (error) {
            res.send("there was an error")
        } else {
            const message = "You Have Been Deleted !";
            res.render("homepage", {
                message: message,

            })
        }
    })

})




//.........................user logout

app.get("/logout", (req, res) => {
    authenticated = false;
    res.cookie('jwt', { expires: 0 });
    const message = "see you again soon";
    res.render('homepage', {
        message: message,

    });
});



app.listen(5001, () => {
    console.log("server started on port 5001")
});




