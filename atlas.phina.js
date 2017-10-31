phina.namespace(function() {

  phina.define("phina.asset.Atlas", {
    superClass: "phina.asset.Asset",

    data: null,
    image: null,

    _basePath: null,

    init: function() {
      this.superInit();
    },

    load: function(key, src) {
      this.key = key;
      this.src = src;
      return phina.util.Flow(this._load.bind(this));
    },

    _load: function(resolve) {
      if (this.src.indexOf('/') < 0) {
        this._basePath = './';
      } else {
        this._basePath = this.src.substring(0, this.src.lastIndexOf('/') + 1);
      }

      var self = this;
      this._loadJson()
        .then(this._loadImage.bind(this))
        .then(this._unpack.bind(this))
        .then(function() {
          resolve(self);
        });
    },

    _loadJson: function() {
      var self = this;
      return phina.util.Flow(function(resolve) {
        self.dataType = 'json';
        var xml = new XMLHttpRequest();
        xml.open('GET', self.src);
        xml.onreadystatechange = function() {
          if (xml.readyState === 4) {
            if ([200, 201, 0].indexOf(xml.status) !== -1) {
              var data = JSON.parse(xml.responseText);
              self.data = data;
              resolve();
            }
          }
        };
        xml.send(null);
      });
    },

    _loadImage: function() {
      var self = this;
      return phina.util.Flow(function(resolve) {
        var image = new Image();
        image.src = self._basePath + self.data.meta.image;
        image.onload = function() {
          self.image = image;
          resolve();
        };
      });
    },

    _unpack: function() {
      var self = this;
      var data = self.data;
      var image = self.image;
      var frames = data.frames;
      return phina.util.Flow(function(resolve) {
        if (frames instanceof Array == false) {
          frames = Object.keys(frames).map(function(key) {
            var frame = frames[key];
            frame.filename = key;
            return frame;
          });
        }

        frames.forEach(function(frame) {
          var key = self.key + "/" + frame.filename;
          var canvas = phina.graphics.Canvas();

          var f = frame.frame;
          var s = frame.spriteSourceSize;
          var src = frame.sourceSize;
          var p = frame.pivot;

          canvas.setSize(src.w, src.h);
          if (!frame.rotated) {
            canvas.context.drawImage(image,
              f.x, f.y, f.w, f.h,
              s.x, s.y, s.w, s.h
            );
          } else {
            canvas.context.save();
            canvas.context.translate(src.w * p.x, src.h * p.y);
            canvas.context.rotate(Math.PI * -0.5);
            canvas.context.translate(-src.h * p.y, -src.w * p.x);
            canvas.context.drawImage(image,
              f.x, f.y, f.h, f.w,
              s.y, s.x, s.h, s.w
            );
            canvas.context.restore();
          }
          phina.asset.AssetManager.set('image', key, canvas);
        });

        resolve();
      });
    },

  });

  phina.asset.AssetLoader.register('atlas', function(key, src) {
    var asset = phina.asset.Atlas();
    return asset.load(key, src);
  });

});