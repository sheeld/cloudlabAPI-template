const router = require('express').Router();
const async = require('async');
const Project = require('../models/project');
const User = require('../models/user');
const Promocode = require('../models/promocode');

const logger           = require('morgan'),
      busboyBodyParser = require('busboy-body-parser')

const algoliasearch = require('algoliasearch');
var client = algoliasearch("L3E3RMHJBU", "f5a7555c009dfcabf7e108808f1ff931");
var index = client.initIndex('ProjectSchema');

router.get('/', (req, res, next) => {
  if (req.user) {
    Project.find({ owner: req.user._id }, function(err, projects) {
      if(err) {/*error*/}
      User.find({}, function (err, users) {
        if(err) {/*error*/}
        res.render('main/home', { projects: projects, users: users });
      });
    });
  }else{res.redirect('/login');}
});

router.route('/search')
  .get((req, res, next) => {
    if (req.query.q) {
      index.search(req.query.q, function(err, content) {
        console.log(content);
        res.render('main/search_results', { content: content, search_result: req.query.q });
      });
    }
  })
  .post((req, res, next) => {
    res.redirect('/search/?q=' + req.body.search_input);
  });

router.get('/my-projects', (req, res, next) => {
  Project.find({ owner: req.user._id }, function(err, projects) {
    res.render('main/my-projects', { projects: projects });
  })
});

router.route('/add-new-project')
  .get((req, res, next) => {
    res.render('main/add-new-project');
  })
  .post((req, res, next) => {
    async.waterfall([
      function(callback) {
        var project = new Project();
        project.owner = req.user._id;
        project.name = req.body.project_name;
        project.category = req.body.project_category;
        project.about = req.body.project_about;
        project.save(function(err) {
          callback(err, project);
        });
      },

      function(project, callback) {
        User.update(
          {
            _id: req.user._id
          },{
            $push: { projects: project._id }
          }, function(err, count) {
            res.redirect('/my-projects');
          }
        )
      }
    ]);
  });

router.get('/project_service/:id', (req, res, next) => {
  Project.findOne({ _id: req.params.id })
    .populate('owner')
    .exec(function(err, project) {
      res.render('main/project_service', { project: project });
    });
});

router.get('/api/add-promocode', (req, res, next) => {
  var promocode = new Promocode();
  promocode.name = "testcoupon";
  promocode.discount = 0.4;
  promocode.save(function(err) {
    res.json("Successful");
  });
});

router.post('/promocode', (req, res, next) => {
  var promocode = req.body.promocode;
  var totalPrice = req.session.price;
  Promocode.findOne({ name: promocode }, function(err, foundCode) {
    if (foundCode) {
      var newPrice = foundCode.discount * totalPrice;
      newPrice = totalPrice - newPrice;
      req.session.price = newPrice;
      res.json(newPrice);
    } else {
      res.json(0);
    }
  });
});

module.exports = router;