(function($, Modernizr) {
  /* jshint browser: true, devel: true, jquery: true */

  // Pageable constructor
  var Pageable = function(el, options) {
        // Initial Setup
        var $currentPage,
            index;

        this.options = options;

        this.el = el.jquery ? el[0] : el;
        this.$el = el.jquery ? el : $(el);
        this.$pages = this.$el.find(options.pageSelector);

        // Stop because there aren't multiple pages
        //if ( this.$pages.length < 2 ) { return; }

        this.$pages.addClass(options.pageClass);

        this.$nav = $();

        this.eventend = this.options.transitionType + 'end webkit' + ( this.options.transitionType.charAt(0).toUpperCase() + options.transitionType.substr(1).toLowerCase() ) + 'End';

        if ( options.startPage === -1 ) {
          this.$currentPage = null;
          this.$pages.removeClass(options.pageCurrentClass);
        } else {
          $currentPage = $.isNumeric(options.startPage) ? $(this.$pages[options.startPage]) : this.$pages.filter('.' + options.pageCurrentClass);

          this.$currentPage = ( $currentPage.length ? $currentPage : this.$pages.filter(':lt(' + this.options.pages + ')') )
            .addClass(options.pageCurrentClass);

          if ( this.$currentPage.length < options.pages ) {
            index = this.$pages.index($currentPage) - ( this.$pages.index($currentPage) % options.pages );
            this.$currentPage = this.$pages.filter(function(i) {
              return i >= index && i < index + options.pages;
            }).addClass(options.pageCurrentClass);
          }

          if ( this.$currentPage.length > options.pages ) {
            this.$pages.removeClass(options.pageCurrentClass);
            this.$currentPage = this.$currentPage.first().addClass(options.pageCurrentClass);
          }
        }

        this.$el.addClass('pageable');

        if ( options.container ) {
          this.$container = $("<div class='pageable__pages'></div>").appendTo(this.$el);//.append;
          this.$pages.appendTo(this.$container);
        }

        this.options.beforeChange.call(this, this.$currentPage);

        if ( options.showButtons ) {
          delegateEvents.call(this);
          addButtons.call(this);
        }
        addNav.call(this);
        activateControls.call(this);

        this.init();

        this.options.afterLoad.call(this, this.$currentPage);
        //this.options.afterChange.call(this, this.$currentPage);

      },

      // Private Methods
      addNav = function() {
        if ( this.options.showNav ) {
          var _this = this;
          if ( this.$nav ) { this.$nav.remove(); }
          this.$nav = this.$el.append('<nav class="' + this.options.navClass + '">' + $.map(this.$pages, function(el, i) {
            var title = $(el).data('title');
            return '<button class='+_this.options.navButtonClass+'><span' + ( title ? '' : ' class="' + _this.options.screenreaderClass + '"' ) + '>' + ( title || i + 1 ) + '</span></button>';
          }).join('') + '</nav>')
            .find('.' + this.options.navClass + ' button')
            .on('click', function() {
              _this.changePage(_this.$nav.index(this));
            });

        }
      },

      addButtons = function() {
        var prefix = this.options.iconPrefix,
            buttonClass = this.options.buttonClass;
        this.$el.append($.map(this.options.directions, function(dir) {
          return '<button class="' + prefix + dir + ' ' + buttonClass + '"></button>';
        }));
      },

      delegateEvents = function() {
        var _this = this,
            prefix = this.options.iconPrefix;
        this.$el.on('click.pageable', '[class^="' + prefix + '"]', function(ev) {
          var dir,
              forwards;
          if ( ! _moving ) {
            _moving = true;
            dir = this.className.match(new RegExp('\\b' + prefix + '(.*?)(?:\\s|$)'))[1].toLowerCase();
            forwards = ( dir === 'right' || dir === 'down' );
            _this.changePage(_this.$pages.index(_this.$currentPage) + ( forwards ? 1 : -1 ) * _this.options.pages);
          }
          ev.stopPropagation();
          ev.preventDefault();
        });
      },

      activateControls = function() {
        if ( this.options.controlsSelector ) {
          var _this = this;

          this.$controls = $(this.options.controlsSelector).addClass(this.options.controlsClass).click(function(e){
            var $this = $(this),
              target = $this.data("target") || $this.attr("href");

            _this.options.controlClick.call(_this, this, e);

            if (e.metaKey || e.ctrlKey) { return; } // If user is attempting to open new tab, don't e.preventDefault();

            if ( $(target).length ) {
              _this.changePage( target );
              e.preventDefault();
            }
          }).attr("role","tab");

          this.$pages.attr("role","tabpanel");
        }
      },

      // Prototype reference
      proto = Pageable.prototype,
      _moving = false,
      defaults;

  proto.init = function() {
    var index = this.$pages.index(this.$currentPage);

    if ( ! this.options.loop ) {
      this.$el.toggleClass(this.options.moreClass, index + this.options.pages < this.$pages.length)
        .toggleClass(this.options.fewerClass, index > 0);
    } else {
      this.$el.addClass(this.options.fewerClass + ' ' + this.options.moreClass);
    }

    if ( this.options.showNav ) {
      this.$nav.eq(index)
        .addClass(this.options.navCurrentClass)
        .siblings()
          .removeClass(this.options.navCurrentClass);
    }

    if ( this.options.controlsSelector && this.$currentPage ) {
      var id = this.$currentPage.attr("id");
      this.$controls
        .removeClass(this.options.controlsCurrentClass)
        .filter("[href='#"+id+"'],[data-target='#"+id+"']")
          .addClass(this.options.controlsCurrentClass);
    }
  };

  proto.index = function(){
    console.log("reindexing");
    this.$pages = this.$el.find(this.options.pageSelector);
    this.$pages
      .addClass(this.options.pageClass)
      .removeClass(this.options.pageBeforeClass)
      .filter(':lt(' + this.$pages.index("." + this.options.pageCurrentClass) + ')')
        .addClass(this.options.pageBeforeClass);

    addNav.call(this);
    //activateControls.call(this);

    this.init();
  };

  proto.changePage = function(page) {

    this.options.beforeChange.call(this, this.$currentPage);

    // If not numeric, try to get page index by object
    var index = $.isNumeric(page) ? parseInt(page) : ( this.$pages.index($(page)) >= 0 ? this.$pages.index($(page)) : '' );

    if ( $.isNumeric(index) ) {

      var _this = this,
          howMany = this.options.pages,
          forwards = index > this.$pages.index(this.$currentPage),
          to = this.$pages.filter(function(i) {
            return i >= index && i < index + howMany;
          }),
          from = this.$currentPage,
          pageCurrentClass = this.options.pageCurrentClass,
          pageBeforeClass = this.options.pageBeforeClass,
          pageChangingClass = this.options.pageChangingClass,
          indexChanged = false,
          addBeforeToFrom = forwards;

      if ( ! to.length ) {
        if ( this.options.loop ) {
          indexChanged = true;
          index = index <= 0 ? this.$pages.length - this.options.pages : 0;
          to = this.$pages.filter(function(i) {
            return i >= index && i < index + howMany;
          });
        } else {
          _moving = false;
          return;
        }
      }

      // Reset pageBeforeClass on $pages based on new $currentPage
      this.$pages
        .not(':eq(' + index + ')')
          // Prevent transitions on items that aren't changing
          .css(this.options.transitionType, 'none')
          // Accessibility attributes
          .attr("aria-hidden",true)
          .attr("tabindex","-1")
          // Toggle pageBeforeClasses
          .removeClass(pageBeforeClass)
          .filter(':lt(' + index + ')')
            .addClass(pageBeforeClass);

      if ( indexChanged ) {
        addBeforeToFrom = index === 0;
        to.toggleClass(pageBeforeClass, index !== 0);
      }

      this.$currentPage = to;
      this.options.afterChange.call(this, this.$currentPage);

      if ( Modernizr && Modernizr['css' + this.options.transitionType + 's'] ) {
        setTimeout(function() {
          if ( from ) {
            from.css(_this.options.transitionType, '')
              // Accessibility attributes
              .attr("aria-hidden",false)
              .addClass(pageChangingClass)
              .toggleClass(pageBeforeClass, addBeforeToFrom)
              .one(_this.eventend, function() {
                from.removeClass(pageChangingClass)
                  .css(_this.options.transitionType, 'none')
                  .toggleClass(pageBeforeClass, forwards || ( ! addBeforeToFrom && indexChanged ));
                  setTimeout(function() {
                    from.css(_this.options.transitionType, '')
                      // Accessibility attributes
                      .attr("aria-hidden",true);
                    _this.options.afterFromTransition.call(_this, _this.$currentPage);
                  }, 20);
              });
          }
          to.css(_this.options.transitionType, '')
            .addClass(pageChangingClass)
            // Accessibility attributes
            .attr("aria-hidden",false)
            .attr("tabindex","")
            .one(_this.eventend, function() {
              _moving = false;
              setTimeout(function() {
                to.removeClass(pageChangingClass + ' ' + pageBeforeClass)
                  .nextAll()
                  .removeClass(pageBeforeClass);
                setTimeout(function() {
                  _this.$pages.css(_this.options.transitionType, '');
                  _this.options.afterToTransition.call(_this, _this.$currentPage);
                }, 20);
              }, 13);
            });
          setTimeout(function() {
            if ( from ) { from.removeClass(pageCurrentClass); }
            to.addClass(pageCurrentClass);
          }, 20);
        }, 20);
      } else {
        // Fallback to jquery.animate
        _moving = false;
        from.removeClass(pageCurrentClass);
        to.addClass(pageCurrentClass);
        _this.options.afterFromTransition.call(_this, _this.$currentPage);
        _this.options.afterToTransition.call(_this, _this.$currentPage);
      }
      this.init();
    }
  };

  proto.next = function() {
    this.changePage(this.$pages.index(this.$currentPage) + 1);
  };

  proto.prev = function() {
    this.changePage(this.$pages.index(this.$currentPage) - 1);
  };

  proto.close = function() {
    this.$nav.remove();
    this.$el.removeClass('pageable')
      .off('click.pageable');
    this.$el.find('> .'+this.options.buttonClass)
      .remove();
  };

  $.fn.pageable = function(options) {
    var isMethod = typeof options === 'string',
        args = isMethod ? Array.prototype.slice.call(arguments, 1) : null,
        opts = isMethod ? options : $.extend({}, defaults, options);

    return this.each(function() {
      var pageable = $.data(this, 'pageable');
      if ( pageable ) {
        if ( $.isNumeric(options) ) {
          // Trigger changePage if options is numeric
          return pageable.changePage.apply(pageable, [options]);
        } else if ( isMethod ) {
          // Trigger function if options is string
          if ( $.isFunction(pageable[opts]) ) {
            return opts !== 'init' ? pageable[opts].apply(pageable, args) : null;
          } else {
            console.warn('The Pageable object has no method ' + opts);
            return false;
          }
        } else {
          pageable.close();
        }
      }
      $.data(this, 'pageable', new Pageable(this, opts));
    });
  };

  defaults = $.fn.pageable.defaults = {

    // Classes
    pageableClass: 'pageable',
    moreClass: 'pageable--more',
    fewerClass: 'pageable--fewer',
    containerClass: 'pageable__container',
    pageClass: 'pageable__page',
    pageCurrentClass: 'pageable__page--current',
    pageBeforeClass: 'pageable__page--before',
    pageChangingClass: 'pageable__page--changing',

    controlsClass: 'pageable__control',
    controlsCurrentClass: 'pageable__control--current',

    navClass: 'pageable__nav',
    navCurrentClass: 'pageable__nav--current',
    navButtonClass: '',

    buttonClass: 'pageable__button',
    iconPrefix: 'icon-angle-',
    screenreaderClass: 'visuallyhidden',

    // Options
    pageSelector: '> *',
    controlsSelector: '',
    transitionType: 'transition', // transition or animation
    directions: ['left', 'right', 'up', 'down'],
    showNav: true,
    showButtons: true,
    loop: true, // Loop from beginning to end
    startPage: false, // Index of start page
    pages: 1,
    container: true, // Wrap pages in container

    // Callbacks
    controlClick: $.noop(), // Triggered before $currentPage variable has been updated, function($currentPage,e,$target){}
    beforeChange: $.noop(), // Triggered before $currentPage variable has been updated, function($currentPage){}
    afterChange: $.noop(), // Triggered after $currentPage variable has been updated, function($currentPage){}
    afterFromTransition: $.noop(), // Triggered after 'from' transition has finished, function($currentPage){}
    afterToTransition: $.noop(), // Triggered after 'to' transitions has finished, function($currentPage){}
    afterLoad: $.noop(), // afterLoad callback, function($currentPage){}
  };

})(jQuery, window.Modernizr);