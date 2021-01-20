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

app.get('/', (req, res) => {
    res.render('homepage');
});


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
                            res.render('homepage', {
                                message: "user registered"
                            })
                        }
                    })
            }
        })

    console.log(hashedPassword)
})

app.get('/register', (req, res) => {
    res.render('register');
});


app.get('/loginPage', (req, res) => {
    res.render('loginPage');
});

app.post('/userLogin', async (req, res) => {

    try {

        const email = req.body.userEmail;
        const password = req.body.userPassword;

        if (!email || !password) {
            return res.status(400), render('loginPage', {
                message: "please check details",
                loggedIn: authenticated,
            })
        }

        db.query('SELECT * FROM users WHERE email =? ', [email], async (error, results) => {
            console.log(results);



            if (!results || !(await bcrypt.compare(password, results[0].password)))
                res.status(401).render('loginPage', {
                    message: "email or password incorrect",
                    loggedIn: authenticated,
                })
            else {
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
                res.status(200).render("homepage", {
                    loggedIn: authenticated,
                })
            }
        })

    } catch (error) {
        console.log(error)
    }
})



app.get("/profile/:id", (req, res) => {

    const user = req.params.id;


    db.query( "SELECT * FROM users WHERE id=?" , [user], (error, results) => {
        if (error) {
            console.log(error)
            res.send("theres an error")
        } else {
            console.log(results)

            res.render('profile',  {

               userId:user,

                name: results[0].name,
                age: results[0].age,
                location: results[0].location,
                email: results[0].email,


                loggedIn: authenticated,


            })
        }
    })
});

// app.get('/profile', (req, res) => {
//     res.render('profile');
// });


// app.get('/userSelect', (req, res) => {
//     db.query("SELECT * FROM users", (error, results) => {


//         res.render('userSelect', {
//             users: results
//         });
//     });

// });



// app.get('/update/:id', (req, res,) => {

    // const user = req.params.id;
    // db.query('SELECT * FROM users WHERE id=?', [user], (error, results) => {
    //     if (!error) {

    //         res.render("updateUser", { userId: user, name: results[0].name, age: results[0].age, location: results[0].location, email: results[0].email })
    //     }
    // })


// })




// app.post('/updated/:userId', (req, res,) => {


//     const name = req.body.userName;
//     console.log(name)
//     const age = req.body.userAge;
//     console.log(age)
//     const location = req.body.userLocation;
//     console.log(location)
//     const email = req.body.userEmail;
//     console.log(email)
//     const password = req.body.userPassword;
//     console.log(password)

//     const id = req.params.userId;
//     console.log(id)


//     const query = 'UPDATE users SET name = ?, age = ?, location = ?, email = ?, password = ?  WHERE id = ?';

//     let user = [name, age, location, email, password, id];

//     db.query("SELECT email from users WHERE email = ?", [email], (error, results) => {

//         if (error) {
//             console.log(error)
//             res.send("There was an error")
//         } else {

//             if (results.length > 0) {//.......email check broken
//                 const errorMessage = "ERROR EMAIL ALREADY EXISTS";
//                 res.render("errorpage", {
//                     errorMessage: errorMessage

//                 })


//             } else {

//                 db.query(query, user, (error, results) => {

//                     if (error) {
//                         console.log(error)
//                         res.send("There was an error")
//                     } else {
//                         console.log(results)
//                         res.send('user updated')
//                     }
//                 })
//             }


//         }
//     })
// })




// app.post('/userInfo:userId', (req, res) => {


//     const user = req.params.userId

//     db.query('SELECT * FROM users WHERE id=?',

//         [user], (error, results) => {

//             if (error) {
//                 console.log(error)
//                 res.send("theres an error")
//             } else {
//                 console.log(results)
//                 res.render('userInformation', { userId: user, name: results[0].name, age: results[0].age, location: results[0].location, email: results[0].email })
//             }
//         })
// });

// app.get('/userBlogs', (req, res) => {
//     res.render('userBlogs');
// })


// app.get('/viewblogs/:userId', (req, res) => {

//     const id = req.params.userId
//     console.log(id)
//     const user = [id]
//     console.log(user)

//     db.query('SELECT a.*, b.name FROM blog_posts a INNER join users b on a.users_id = b.id WHERE users_id = ? order by dt desc',

//         user, (error, results) => {

//             results.forEach((result, i) => {//...........need to fix time stamp
//                 results[i].dt = timestampToDate(results[i].dt)
//             })
//             if (results.length > 0) {

//                 res.render('userBlogs', { blogs: results });
//             } else {

//                 console.log(error)
//                 res.send("theres an error")

//             }
//         })
// });


// app.get('/createBlog/:userId', (req, res) => {
//     const id = req.params.userId;
//     res.render('createBlog', { userId: id });
// })



// app.post('/createBlog/:userId', (req, res) => {

//     const id = req.params.userId;
//     console.log(id);


//     const title = req.body.title
//     console.log(title)
//     const body = req.body.body
//     console.log(body)


//     db.query('INSERT INTO blog_posts SET ?', { title: title, body: body, users_id: id }, (error, results) => {

//         if (error) {
//             console.log(error)
//             res.send("theres an error")
//         } else {
//             console.log(results)
//             res.send('blog updated')
//         }
//     })
// });



// app.get('/deletePage', (req, res) => {
//     res.render('deletePage');
// });


// app.post("/deleteuser/:id", (req, res) => {

//     const id = req.params.id;
//     console.log(id)
//     let query = 'DELETE FROM users WHERE id= ?';
//     let user = [id];


//     db.query(query, user, (error, results) => {
//         if (error) {
//             res.send("there was an error")
//         } else {
//             res.render("deletePage")
//         }
//     })

// })



// const timestampToDate = (date) => {

//     const day = date.toLocaleDateString().split('/')[1];
//     const month = date.toLocaleDateString().split('/')[0];
//     const year = date.toLocaleDateString().split('/')[2];

//     return `${day}/${month}/${year}`;
// }




app.listen(5001, () => {
    console.log("server started on port 5000")
});




