require('dotenv').config();
const express = require('express');
const bcrypt = require('bcrypt');
const flash = require('express-flash');
const session = require('express-session');

const db = require('./connection/db');
const upload = require('./middlewares/uploadFile');

const app = express();
const PORT = process.env.PORT || 5000;

let isLogin = true; // boolean => true/false

const month = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

let blogs = [
  {
    title: 'Pasar Coding di Indonesia Dinilai Masih Menjanjikan',
    content:
      'Ketimpangan sumber daya manusia (SDM) di sektor digital masih menjadi isu yang belum terpecahkan. Berdasarkan penelitian ManpowerGroup, ketimpangan SDM global, termasuk Indonesia, meningkat dua kali lipat dalam satu dekade terakhir. Lorem ipsum, dolor sit amet consectetur adipisicing elit. Quam, molestiae numquam! Deleniti maiores expedita eaque deserunt quaerat! Dicta, eligendi debitis?',
    author: 'Ichsan Emrald Alamsyah',
    post_at: '12 Jul 2021 22:30 WIB',
  },
];

app.set('view engine', 'hbs'); // set tample engine

app.use('/public', express.static(__dirname + '/public')); // set public folder/path
app.use('/uploads', express.static(__dirname + '/uploads')); // set public folder/path
app.use(express.urlencoded({ extended: false }));

app.use(flash());

app.use(
  session({
    cookie: {
      maxAge: 2 * 60 * 60 * 1000,
      secure: false,
      httpOnly: true,
    },
    store: new session.MemoryStore(),
    saveUninitialized: true,
    resave: false,
    secret: 'secretValue',
  })
);

app.get('/', (req, res) => {
  res.render('index');
});

app.get('/blog', function (req, res) {
  // Route for blog data

  let query = `SELECT blog.id, blog.title, blog.content, blog.image, tb_user.name AS author, blog.author_id, blog.post_at
                    FROM blog LEFT JOIN tb_user
                    ON blog.author_id = tb_user.id`;

  db.connect(function (err, client, done) {
    if (err) throw err;

    client.query(query, function (err, result) {
      done();
      if (err) throw err;
      let data = result.rows;

      data = data.map(function (blog) {
        return {
          ...blog,
          post_at: getFullTime(blog.post_at),
          post_age: getDistanceTime(blog.post_at),
          isLogin: req.session.isLogin,
          image:
            blog.image == 'null'
              ? '/public/assets/blog-img.png'
              : '/uploads/' + blog.image,
        };
      });

      res.render('blog', {
        isLogin: req.session.isLogin,
        blogs: data,
        user: req.session.user,
      });
    });
  });
});

app.get('/add-blog', function (req, res) {
  // Route for add-blog
  res.render('add-blog', {
    isLogin: req.session.isLogin,
    user: req.session.user,
  });
});

app.post('/blog', upload.single('image'), function (req, res) {
  // Route for post blog
  let data = req.body;

  if (!req.session.isLogin) {
    req.flash('danger', 'Please login');
    return res.redirect('/add-blog');
  }

  let authorId = req.session.user.id;
  let image = req.file ? req.file.filename : null;

  let query = `INSERT INTO blog(title, content, image, author_id) VALUES ('${data.title}', '${data.content}', '${image}', '${authorId}')`;

  db.connect(function (err, client, done) {
    if (err) throw err;

    client.query(query, function (err, result) {
      done();
      if (err) throw err;
      res.redirect('/blog');
    });
  });
});

app.get('/delete-blog/:id', function (req, res) {
  let id = req.params.id;
  let query = `DELETE FROM blog WHERE id = ${id}`;

  db.connect(function (err, client, done) {
    done();
    if (err) throw err;
    client.query(query, function (err, result) {
      if (err) throw err;
      res.redirect('/blog');
    });
  });
});

app.get('/contact-me', function (req, res) {
  // Route for contact me
  res.render('contact');
});

app.get('/update-blog/:id', function (req, res) {
  let id = req.params.id;

  db.connect(function (err, client, done) {
    if (err) throw err;

    client.query(`SELECT * FROM blog WHERE id = ${id}`, function (err, result) {
      done();
      if (err) throw err;
      let data = result.rows[0];

      data = {
        ...data,
        image:
          data.image == 'null'
            ? '/public/assets/my-img.png'
            : '/uploads/' + data.image,
      };

      console.log(data);

      res.render('update-blog', {
        blog: data,
        isLogin: req.session.isLogin,
        user: req.session.user,
      });
    });
  });
});

app.get('/detail-blog/:id', function (req, res) {
  let id = req.params.id;

  db.connect(function (err, client, done) {
    if (err) throw err;

    client.query(`SELECT * FROM blog WHERE id = ${id}`, function (err, result) {
      done();
      if (err) throw err;
      let data = result.rows[0];

      console.log(data);

      res.render('blog-detail', { id: id, blog: data });
    });
  });
});

app.post('/update-project', upload.single('image'), function (req, res) {
  // Route for post blog
  let data = req.body;
  let query;
  if (req.file) {
    query = `UPDATE blog
                  SET title='${data.title}', content='${data.content}', image='${req.file.filename}'
                  WHERE blog.id = ${data.id};`;
  } else {
    query = `UPDATE blog
                  SET title='${data.title}',  content='${data.content}'
                  WHERE blog.id = ${data.id};`;
  }

  db.connect(function (err, client, done) {
    if (err) throw err;

    client.query(query, function (err, result) {
      if (err) throw err;
      done();

      console.log(result);

      res.redirect('/blog');
    });
  });
});

app.get('/register', function (req, res) {
  res.render('register');
});

app.post('/register', function (req, res) {
  const { email, name, password } = req.body;

  const hashedPassword = bcrypt.hashSync(password, 10);

  let query = `INSERT INTO tb_user(name, email, password) VALUES('${name}', '${email}', '${hashedPassword}')`;

  db.connect(function (err, client, done) {
    done();
    if (err) throw err;

    client.query(query, function (err, result) {
      if (err) throw err;
      res.redirect('/login');
    });
  });
});

app.get('/login', function (req, res) {
  res.render('login');
});

app.post('/login', function (req, res) {
  const { email, password } = req.body;

  let query = `SELECT * FROM tb_user WHERE email = '${email}'`;

  db.connect(function (err, client, done) {
    if (err) throw err;

    client.query(query, function (err, result) {
      done();
      if (err) throw err;

      if (result.rows.length == 0) {
        req.flash('danger', "Email & Password don't match!");
        return res.redirect('/login');
      }

      let isMatch = bcrypt.compareSync(password, result.rows[0].password);

      if (isMatch) {
        req.session.isLogin = true;
        req.session.user = {
          id: result.rows[0].id,
          name: result.rows[0].name,
          email: result.rows[0].email,
        };

        req.flash('success', 'Login success');
        res.redirect('/blog');
      } else {
        req.flash('danger', "Email & Password don't match!");
        res.redirect('/login');
      }
    });
  });
});

app.get('/logout', function (req, res) {
  req.session.destroy();
  res.redirect('/blog');
});

app.listen(PORT, function () {
  console.log(`Server starting on PORT: ${PORT}`);
});

function getFullTime(time) {
  const date = time.getDate();
  const monthIndex = time.getMonth();
  const year = time.getFullYear();

  const hours = time.getHours();
  const minutes = time.getMinutes();

  return `${date} ${month[monthIndex]} ${year} ${hours}:${minutes} WIB`;
}

function getDistanceTime(time) {
  const distance = new Date() - new Date(time);

  // Convert to day
  const miliseconds = 1000;
  const secondsInMinute = 3600; //Second in 1 minute
  const hoursInDay = 23;
  const dayDistance = distance / (miliseconds * secondsInMinute * hoursInDay);

  if (dayDistance >= 1) {
    return Math.floor(dayDistance) + ' day ago';
  } else {
    // Convert to hour
    const hourDistance = Math.floor(distance / (1000 * 60 * 60));
    if (hourDistance > 0) {
      return hourDistance + ' hour ago';
    } else {
      // Convert to minute
      const minuteDistance = Math.floor(distance / (1000 * 60));
      return minuteDistance + ' minute ago';
    }
  }
}
