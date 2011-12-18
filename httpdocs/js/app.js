window.console || (window.console = {log: function(){}});

_.mixin({
    toDecimal: function (val) {
//        console.log('args: %o', arguments);
        var value = (val + '').replace(/[^\d\.-]/g, '') || '0.00';
        if (isNaN(parseFloat(value))) return val;

        var places = arguments[1] || 2,
            asArray = arguments[2] || false,
            pattern = "/(\\.\\d{2,"+(places>2 ? places-1 : places)+"})0+$/g",
            result = parseFloat(value).toFixed(places).replace(/(\.\d{2})0+$/g, '$1');
//        console.log('trailing zeroes pattern was %s', pattern);
        if (asArray) {
            return result.split('.');
        } else {
            return result;
        }
    },
    toPercent: function(val){
        return  (val) ? _.toDecimal((parseFloat(val)||0)*100, 2) + '%' : '--';
    },
    padString: function () {
        var str = (arguments[0] + '') || '',
            len = arguments[1] || 0,
            chr = (arguments[2] || '0') + '',
            side = arguments[3] || 'left',
            op = (side == 'left') ? 'unshift' : 'push',
            list = str.split('');
        while (list.length < len) {
            list[op](chr);
        }
        return list.join('');
    },
    padRight: function() {
        if (!arguments[2]) {
            throw "padRight must be called with at least three (3) or arguments."
        } else {
            var args = _.toArray(_.first(arguments,3));
            args.push('right');
        }
        return _.padString.apply(null, args);
    },
    title: function(str) {
        return (""+(str||'')).replace(/\w\S*/g, function(txt){return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();});
    },
    // Date functions
    normalize_date: function(){
        var args = _.toArray(arguments), sep = '-', year_idx, year, mo, day, str_date, date_split;
        if (args.length === 1 && _.isString(args[0])) {
            str_date = args.shift();
            date_split = str_date.split(/[\/-]/g);
            if (str_date.match(/^[A-Za-z]+/) || date_split.length !== 3) return str_date;
            if (~str_date.indexOf('/')) {
                year_idx = 2;
                mo = date_split[0];
                day = date_split[1];
            }
            if (~str_date.indexOf('-')) {
                year_idx = (date_split[0].length === 4) ? 0 : 2;
                mo = date_split[year_idx===0 ? 1 : 0];
                day = date_split[year_idx===0 ? 2 : 1];
            }
            year = (date_split[year_idx].length === 4)
                ? date_split[year_idx]
                : (date_split[year_idx]*1)+2000;

            return [year, _.padString(mo,2), _.padString(day,2)].join(sep);
        }
        return args[0];
    },
    timeStamp: function(){
        var date = new Date(),
            year = date.getFullYear(),
            mo = date.getMonth()+1,
            day = date.getDate();

        return year +'-'
          + _.padString(mo, 2)+'-'
          + _.padString(day,2)+' '
          + _.padString(date.getHours(),2)+':'
          + _.padString(date.getUTCMinutes(),2)+':'
          + _.padString(date.getUTCSeconds(),2)
    },
    today: function(){
        var date = new Date(),
            year = date.getFullYear(),
            mo = date.getMonth()+1,
            day = date.getDate();

        return year +'-'
          + _.padString(mo, 2)+'-'
          + _.padString(day,2)
    },
    uuid: (function() {
        // Private array of chars to use
        var CHARS = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'.split('');

        return function (len, radix) {
            var chars = CHARS, uuid = [], i;
            radix = radix || chars.length;

            if (len) {
                // Compact form
                for (i = 0; i < len; i++) uuid[i] = chars[0 | Math.random() * radix];
            } else {
                // rfc4122, version 4 form
                var r;

                // rfc4122 requires these characters
                uuid[8] = uuid[13] = uuid[18] = uuid[23] = '-';
                uuid[14] = '4';

                // Fill in random data.  At i==19 set the high bits of clock sequence as
                // per rfc4122, sec. 4.1.5
                for (i = 0; i < 36; i++) {
                    if (!uuid[i]) {
                        r = 0 | Math.random() * 16;
                        uuid[i] = chars[(i == 19) ? (r & 0x3) | 0x8 : r];
                    }
                }
            }

            return uuid.join('');
        };
    })(),
    flip: function(obj){
        var final={};
        _.each(obj, function(val, key){
            final[val] =  key;
        });
        return final;
    }
});

//Shimming in ECMA5 features here
if (typeof String.prototype.trim !== 'function') {
  String.prototype.trim = function() {
    return this.replace(/^\s+|\s+$/g, '');
  }
}

if (!window.App) var App = {
    kernel: "0.5",
    init_funcs: [],
    _run_init: function(module){
        if (module.init_funcs && module.init_funcs.length) {
//            console.log('Running init funcs.');
            for (var i = 0, _len = module.init_funcs.length; i < _len; i++) {
                module.init_funcs[i]();
            }
            module.initialized = true;
        }
    },
    init: function(){
        var _k = window.App,
            module = arguments[0] || _k;
        if (module == _k) {
            for (key in window.App) {
//                console.log('Initializing %s', key);
                _k._run_init(window.App[key]);
            }
        } else {
            _k._run_init(module);
        }
    },
    /*! (c) 2011 Aaron McCall
     *  MIT License (see http://creativecommons.org/licenses/MIT/).
     */
    registry: function(){
        //Create private members and methods
        var _container = {},
            _keys = [];

        //Create public API members and methods
        var pub = {
            version: '0.5',
            length: 0,

            /**
             * Sets value of _key to _val if _key is not defined, throws error
             * if defined.
             */
            add: function(_key, _val) {
                if (_container[_key] !== undefined) {
                    throw "Cannot add '" + _key + "' to the registry because it already exists."
                }
                _container[_key] = _val;
                _keys.push(_key);
                pub.length = _keys.length;
                return _container[_key];
            },

            /**
             * Empties the _container of all members, resets _keys to an empty Array,
             * and sets length to zero (0).
             */
            clear: function() {
                _container = {};
                _keys = [];
                pub.length = 0;
            },

            /**
             * Returns key matching index in the _keys Array or null if no match.
             */
            key: function(index) {
                return (_keys[index]) ? _keys[index] : null;
            },

            /**
             * Sets value of _key to _val whether _key is defined or not
             */
            set: function(_key, _val) {
                var _new_key =  (_(_keys).indexOf(_key) < 0);
                _container[_key] = _val;

                if (_new_key) _keys.push(_key);

                pub.length = _keys.length;
                return _container[_key];

            },

            /**
             * Functions like get IFF the key already exists, else sets the key
             * to the provided default
             *
             * @param _key      Key to retrieve
             * @param _default  Default to set to _key and to return if _key is not set
             */
            setdefault: function(_key, _default) {
                if (_container[_key] === undefined) {
                    _container[_key] = (typeof _default == "function")
                                        ? _default()
                                        : _default;
                    _keys.push(_key);
                    pub.length = _keys.length;
                }
                return _container[_key];
            },

            /**
             * Retrieves value of key or false if not set
             * @param string key
             * @return mixed value
             */
            get: function (_key) {
                if (_container[_key] !== undefined) {
                    return _container[_key];
                }
                return undefined;
            },

            /**
             * Test whether a particular key is set
             * @param string key
             * @return boolean
             */
            isset: function (_key) {
                return _container[_key] !== undefined
            },

            /**
             * Allows appending additional members to an Array stored in _key
             * without first retrieving _key.
             *
             * If _key
             * Upon success
             * @param {String} _key
             * @param {Mixed} _val
             * @return {Integer} length of array
             */
            push: function(_key, _val) {
                var _obj = pub.setdefault(_key, []);
                if (!_.isArray(_obj)) {
                    throw 'Cannot push to a non-array, non-empty key!';
                }
                _container[_key].push(_val);
                return _container[_key].length;
            },

            /**
             * Removes value identified by _key if and returns it if it is set,
             * false if it is not set.
             * @param {String} _key
             * @return {Mixed} value or false if not set
             */
            remove: function(_key) {
                if (pub.isset(_key)) {
                    _val = _container[_key];
                    delete _container[_key];
                    _keys.splice(_(_keys).indexOf(_key),1);
                    pub.length = _keys.length;
                    return _val;
                }
                return false;
            },

            list_keys: function(){console&&console.dir&&console.dir(_keys);},

            init_funcs: [function(){window._kr = window.App.registry}]
        };
        //Return public API
        return pub;
    }(),

    updateLastModOnSave: function(){
        App.subscribe('sale_save_initiated', function(data){
            this.set({'last_modified': data.timestamp}, {silent: true});
        }, this);
    },

    signals: {
        extend: function(target, source) {
            _.each(source, function(list, name){
                target[name] = [].concat(list);
            });
            return target;
        },

        extend2: function(source, target) {
            var output;
            output = {};
            _.each(source, function(val, name) {
                var after, callbacks, position;
                position = (target[name] != null) && !_.isFunction(target[name][0]) ? target[name].shift() : 'after';
                after = position === 'after';
                callbacks = target[name] || [];
                if (target[name] != null) {
                    return output[name] = (after ? source[name] : callbacks).concat(after ? callbacks : source[name]);
                } else {
                    return output[name] = [].concat(source[name]);
                }
            });
            _.each(target, function(val, name) {
                if (!_.isFunction(val[0])) {
                    val.shift();
                }
                if (!(source[name] != null) && val.length > 0) {
                    return output[name] = val;
                }
            });
            return output;
        }
    },

    addUuidToPrototype: function(obj, name){
        if (obj.prototype) {
            var UUID = _.uuid();
//            console.log('adding uuid (%s) to %s', UUID, name);
            obj.prototype.uuid = UUID;

        }
    },

    initCsrfProtection: function(){
        $(document).ajaxSend(function(event, xhr, settings) {
            function getCookie(name) {
                var cookieValue = null;
                if (document.cookie && document.cookie != '') {
                    var cookies = document.cookie.split(';');
                    for (var i = 0; i < cookies.length; i++) {
                        var cookie = jQuery.trim(cookies[i]);
                        // Does this cookie string begin with the name we want?
                        if (cookie.substring(0, name.length + 1) == (name + '=')) {
                            cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                            break;
                        }
                    }
                }
                return cookieValue;
            }

            function sameOrigin(url) {
                // url could be relative or scheme relative or absolute
                var host = document.location.host; // host + port
                var protocol = document.location.protocol;
                var sr_origin = '//' + host;
                var origin = protocol + sr_origin;
                // Allow absolute or scheme relative URLs to same origin
                return (url == origin || url.slice(0, origin.length + 1) == origin + '/') ||
                    (url == sr_origin || url.slice(0, sr_origin.length + 1) == sr_origin + '/') ||
                    // or any other URL that isn't scheme relative or absolute i.e relative.
                    !(/^(\/\/|http:|https:).*/.test(url));
            }

            function safeMethod(method) {
                return (/^(GET|HEAD|OPTIONS|TRACE)$/.test(method));
            }

            if (!safeMethod(settings.type) && sameOrigin(settings.url)) {
                xhr.setRequestHeader("X-CSRFToken", getCookie('csrftoken'));
            }
        });
    },

    UI: { autocomplete: {} },

    utils: {
        hasLocalStorage: function() {
            try {
                return 'localStorage' in window && window['localStorage'] !== null;
            } catch (e) {
                return false;
            }
        }
    }
};

//PubSub
(function(attachTo, defaultContext) {
    var topics = {}, obj = attachTo||this, def = defaultContext||this;

    obj.publish = function(topic, args) {
        if (topics[topic]) {
            setTimeout(function(){
                var currentTopic = topics[topic];

                for (var i = 0, j = currentTopic.length; i < j; i++) {
                    currentTopic[i].callback.apply(currentTopic[i].context||def, args || []);
                }
            }, 0);
            return true;
        }
        return false;
    };

    obj.subscribe = function(topic, callback, context) {
        if (!topics[topic]) topics[topic] = [];

        topics[topic].push({callback: callback, context: context||def});

        return {
            "topic": topic,
            "callback": callback
        };
    };

    obj.unsubscribe = function(handle) {
        var topic = handle.topic;

        if (topics[topic]) {
            setTimeout(function(){
                var currentTopic = topics[topic];

                for (var i = 0, j = currentTopic.length; i < j; i++) {
                    if (currentTopic[i] && currentTopic[i].callback === handle.callback) {
                        currentTopic.splice(i, 1);
                        if (!currentTopic.length) delete topics[topic];
                    }
                }
            },0);
        }
    };

})(App);

//Placeholder shim
(function($, bindTo) {
    bindTo = bindTo || this;
    $.support.placeholder = false;
    var test = document.createElement('input');
    if('placeholder' in test) {
        $.support.placeholder = true;
        bindTo.placeholders = {
            initialized: true,
            cleanup: function(){},
            init: function(){}
        }
    } else {
        var pub = {},
        init = function() {
            var selector = arguments[0] || 'form',
                $form = (selector.jquery) ? selector : $(selector);
            if ($form.length) {
                $(function() {
                    var active = document.activeElement;
                    $form.delegate(':text[placeholder], textarea[placeholder]', 'focus', function () {
                        var $el = $(this),
                            _placeholder = $el.attr('placeholder'),
                            _val = $el.val();
                        if (_placeholder != '' && _val == _placeholder) {
                            $el.removeClass('hasPlaceholder').val('');
                        }
                    }).delegate(':text[placeholder], textarea[placeholder]', 'blur', function () {
                        var $el = $(this),
                            _placeholder = $el.attr('placeholder'),
                            _val = $el.val();
                        if (_placeholder != '' && ( _val == '' || _val == _placeholder)) {
                            $el.addClass('hasPlaceholder').val(_placeholder);
                        }
                    }).submit(cleanup).find(':text[placeholder], textarea[placeholder]').blur();

                    $(active).focus();
                });
            }
            pub.initialized = true;
        },
        cleanup = function (event) {
//            console.log('Submit handler fired on %s', this.id);
            $('input.hasPlaceholder, textarea.hasPlaceholder').each(function(){
//                console.log('Clearing placeholder value from %s', this.id);
                this.value = '';
            });
        };

        bindTo.placeholders = {
            initialized: false,
            init_funcs: [init],
            'init': init,
            'cleanup': cleanup
        };
    }
})($, App);

//Taxonomy (Genus, Species, Variety) auto-completer
App.UI.autocomplete.ingredient = (function($){
    var _renderItem = function(ul, item){
        if (item.query) return;
        return $('<li/>').data("item.autocomplete", item)
                         .append()
                         .appendTo(ul)
    };
    return {
        renderItem: _renderItem,
        init: function(){
            var $form = arguments[0] || $('form'),
                _class = arguments[1] || 'ingredient_ac';

            $form.delegate('input.'+_class, 'focus', function(event){
                var $this = $(this),
                    _target = this.id.replace(/_ac/, ''),
                    _type = this.name.replace(/_ac/, ''),
                    _item_tpl = '<a>{{{ common }}}{{{ scientific }}}</a>',
                    _sci_tpl = '<br><span>{{ genus }} {{ species }}</span>',
                    _common_tpl = '{{ variety }} {{ species }} {{ genus }}',
                    _species_tpl = '{{ common }} ({{ scientific }})',
                    _genus_tpl = _species_tpl,
                    _to_html = Flatstache.to_html;
                if (!$this.is(':data(autocomplete)')) {
                    $this.autocomplete({
                        minLength: 2,
                        focus: function(event, ui) {
                            console.log('args: %o', arguments);
//                            event.target.value = ui.item.long_desc;
                            return false;
                        },
                        select: function(event, ui) {
                            var $this = $(event.target);
                            $('#results').append('<li>' + ui.item.long_desc + '</li>');
                            return false;
                        },
                        source: function(req, resp) {
                            $.getJSON("/ingredient/search/", {q: req.term}, resp)
                        }
                    }).data('autocomplete')._renderItem = function(ul, item){
                        if (item.query) return;
                        $('<li/>').data('item.autocomplete', item)
                                  .append('<a>' + item.long_desc + '</a>').appendTo(ul);
                    };
                }
            });
        }
    }
})($);

//jQuery ajaxForm form manager
App.form = (function($){
    var _form,
    _default_opts = {
        beforeSerialize: function(){
            if (App.placeholders && App.placeholders.cleanup) App.placeholders.cleanup();
        },
        success: function(data, status, xhr, $form){
            if (data.success) {
                if (_kr.isset($form.attr('id') + '_data_handler')) {
                    _kr.get($form.attr('id')+ '_data_handler')(data);
                } else if (pub.data_handler) {
                    pub.data_handler(data);
                } else if (data.url) {
                    window.location.href = data.url;
                }
            } else if (data.success === false) {
                if (data.errors) {
                    pub.setForm($form).render_errors(data.errors);
                } else {
                    App.messenger.show('Save failed!');
                }
            }
        },
        dataType: 'JSON'
    },
    _render_errors = function(errors, prefix){
        var _error_list_tpl = '<ul class="errorlist">{{{ errorlist }}}</ul>',
            _prefix = prefix || 'id_',
            target, manip;

        _form.find('ul.errorlist').remove();

        for (name in errors) {
            target = (name != '__all__') ? '#' + _prefix + name : '#' + _form.attr('id');
            manip = (name != '__all__') ? 'after' : 'prepend';

            $(target)[manip](
                Flatstache.to_html(
                    _error_list_tpl,
                    _render_error_items(errors[name]) //Convert items in errors[name] array to li markup
                )
            );
        }
    },
    _render_error_items = function(error_items){
        var _error_item_tpl = '<li>{{ message }}</li>',
            _items = [];
        for (var i = 0, _len = error_items.length; i < _len; i++) {
            _items.push(Flatstache.to_html(_error_item_tpl, {message: error_items[i]}));
        }
        return {errorlist: _items.join("\n")};
    },
    _render_error_bubbles = function(errors, prefix){
        if (!errors) return;
        var prefix = prefix || 'id_',
            errors = (errors.errors) ? errors.errors : errors,
            target;
        for (name in errors) {
            if (name != '__all__') {
                target =  '#' + prefix + name;
//                console.log('name is %s, and target is %s', name, target);
                $(target).parent().addClass('error').attr('data-error', errors[name].join(', '));
            } else {
                target = '#' + _form.attr('id');
            }
        }
    },
    pub = {
        render_errors: _render_errors,
        render_error_bubbles: _render_error_bubbles,
        setForm: function(form){
            if (_.isString(form) || _.isElement(form)) {
                _form = $(form);
            } else if (form.jquery) {
                _form = form;
            }
            return pub;
        },
        init_form: function(form){
            var $form = form || _form || $('form'),
                options = arguments[1] || {},
                publish = options.publish || false,
                topic = options.topic || (($form[0].id) ? $form[0].id + ':success' : 'form:success');
            if ($form && $.fn.ajaxForm) {
                if (options.success && publish) {
//                    console.log('publishing and calling success func!');
                    var old_success = options.success;
                    options.success = function(){
                        var args = _.toArray(arguments);
                        old_success.apply(null, args);
                        App.publish(topic, args);
                    };
                } else if (publish) {
//                    console.log('just publishing!');
                    options.success = function(){
                        App.publish(topic, _.toArray(arguments));
                    }
                }
                pub.options = $.extend({}, _default_opts, options);
//                console.log('initializing form Ajax behaviour.');
                $form.ajaxForm(pub.options);
            }
            return pub;
        }
    };
    return pub;
})($);

//jQuery UI dialog manager
App.dialog = (function($){
    var $dialog = App.registry.setdefault('$dialog', function() { return $('#dialog')}),
        throbber = '<img id="loading" src="/images/loading.gif"/>',
        setup_pagination = function(){
            $dialog.delegate('a.page_next, a.page_previous', 'click', pagination_click_handler);
        },

        ajax_link_handler = function(e){
            var _href = this.href.replace(location.href,'')||'',
                _first = _href.charAt(0)||'';

            if (_href && _first!='#') {
                e.preventDefault();
                e.stopPropagation();
                $dialog.dialog('open').load(this.href)
            }
        },

        setup_ajax_links = function(){
//            console.log('initializing ajax links!');
            $('a.ajax').live('click', App.dialog.ajax_link_handler)
        },

        pagination_click_handler = function(event){
            event.preventDefault();
            $dialog.html(throbber).load(this.href);
            return false;
        },

        init_dialog = function(){
            $(function(){
//                console.log('initializing dialog!');
                $dialog.dialog({
                    autoOpen: false,
                    modal: true,
                    closeText: 'X',
                    position: ['center', 'top'],
                    width: 960,
                    close: function(){
                        App.publish('dialog:close');
                        $('#dialog').html(App.dialog.throbber);
                    }
                });
                setup_pagination();
                setup_ajax_links();
                $dialog.html(App.dialog.throbber);
                App.dialog.initialized = true;
            });

        },

        alert = function(content){
            $dialog.html(content).dialog('option', 'buttons', {"OK": function(){
                $(this).dialog('close');
            }}).dialog('open');
        };

        return {
            alert: alert,
            show: function(content){ return $dialog.html(content||throbber).dialog('open'); },
            initialized: false,
            init_funcs: [init_dialog],
            throbber: throbber,
            ajax_link_handler: ajax_link_handler
        };
})($);

//ViewPort top message bar manager
App.messenger = (function($){
    var $messenger = App.registry.setdefault('$messenger', function(){return $('#messenger')}),
    hide = function(){
        return setTimeout(function(){ _kr.get('$messenger').removeAttr('data-timeout').slideUp('normal'); }, 5000)
    },
    init = function(){
        if ($messenger.length > 0) {
            $messenger.click(function(){
                var $this = $(this);
                clearTimeout($this.attr('data-timeout'));
                $this.removeAttr('data-timeout');
            }).attr('data-timeout', hide);
            $messenger.find('.close_messenger').click(function(event){
                event.stopPropagation();
                $messenger.removeAttr('data-timeout').slideUp('fast');
            });
            if ($messenger.hasClass('has_message')) show();
        }
    },
    show = function(contents){
        if ($messenger.is(':hidden')) {
            if (contents) $messenger.find('p').html(contents);
            $messenger.slideDown('normal').attr('data-timeout', hide);
        }
    };

    return {
        initialized: false,
        init: init,
        init_funcs: [init],
        show: show
    }
})($);

App.render = Flatstache.to_html;

App.history = (function(window, undefined){
    var history = window.history,
        doc = window.document,
        state_changer = function(type, data, title, url){
            this[type+'State'].apply(this, _.rest(arguments));
            if (title && doc.title !== title) doc.title = title;
        },
        noop = function(){};

    return {
        pushState: (history.pushState && _.isFunction(history.pushState)) ? _.bind(state_changer, history, 'push') : noop,
        replaceState: (history.replaceState && _.isFunction(history.replaceState)) ? _.bind(state_changer, history, 'replace') : noop
    };
})(window);

/**
 * Creates a decorator system and attaches it to the attachTo object or current this context as the 'decorator' property
 * The decorator function takes the following arguments:
 * @param options a hash of options of the following structure:
 * options = {
 *     func         : (function) The function to decorate,
 *     context      : (object) Context to attach the decorated function to [optional: defaults to current this],
 *     before       : (function) To run before func [optional],
 *     after        : (function) To run after func [optional],
 *     wrap         : (function) To wrap the original, taking the original function as its first argument
 *                           and passing arguments to the original [optional],
 * }
 * NOTE: One of before, after or wrap MUST be specified or an exception will be thrown
 */
;(function(attachTo, _){
    var attachTo = attachTo||this, isFn = _.isFunction, toArr = _.toArray,

    decorator = function(options){
        if (options.func && options.func.is_decorated && !options.redecorate) return options.func;
        var options = options||{}, middle_func, final_func;
//        if (!options.context) options.context = this;
        if (!options.func || (!_.isFunction(options.before) && !isFn(options.after) && !isFn(options.wrap))) {
            throw "A function to decorate and one or more of a before, after or wrapping function must be specified."
        }
        if (options.wrap && isFn(options.wrap)) {
            options.func = (function(options){
                var wrapper = options.wrap, context = options.context;
                return function() {
                    var args = toArr(arguments);
                    args.unshift(options.func);
//                    console.log('wrapped is %o', wrapped);
                    return wrapper.apply(context||this, args);
                }
            })(options);
        }
        middle_func = function(){
            var orig_return;
            if (options.before) {
                options.before.apply(this, toArr(arguments));
            }
            orig_return = options.func.apply(this, toArr(arguments));
            if (options.after) {
                options.after.apply(this, toArr(arguments));
            }
            return orig_return;
        };
        final_func = (options.context) ? _.bind(middle_func, options.context) : middle_func;
        final_func.is_decorated = true;

        return final_func;
    };

    decorator.decorateMethod = function(obj, methodName, options) {
        if (!obj || !methodName || !options || (!_.isFunction(options.before) && !_.isFunction(options.after) && !_.isFunction(options.wrap))) {
            throw "decorateMethod requires an obj and method and one or more of before, after and wrap options";
        }
        if (methodName == 'render') console.log('decorating render method: Object: %o, Options: %o', obj, options);
        _.extend(options, {
            func: obj[methodName]||function(){},
            context: (options.addContext) ? obj : null
        });
//        console.log('methodName: %s on %o is %o', methodName, obj, obj[methodName]);
        obj[methodName] = App.Decorator(options);
    };

    attachTo.Decorator = decorator;
})(App, _);



App.init();

KeyCandy.init();

// Begin Backbone configuration

App.Backbone = {
    Models      : {},
    Views       : {},
    Collections : {},
    extendAll: {
        signal: function (){
            var args = _.toArray(arguments), signal = args.shift();
            args.unshift('signals:'+signal);
        //    if (signal == 'preInit' && args[2] && args[2].blend) console.log('triggering %s with arguments: %o', signal, args);
            this.trigger.apply(this, args);
        },

        connect: function (signal, callback, context) {
            if (typeof signal === "string" && _.isFunction(callback)) {
                if (context) console.log('Connecting callback to %s signal', signal);
                return (
                    context instanceof Backbone.Model
                    || context instanceof Backbone.Collection
                    || context instanceof Backbone.Router
                    || context instanceof Backbone.View
                ) ? this.bind('signals:'+signal, callback, context) : this.bind('signals:'+signal, callback);
            }
            throw "connect takes two arguments:"
                + "\n1. signal: a string identifying the signal to listen for, and"
                + "\n2. callback: a function to handle the signal"
                + "\nArguments were signal: (" + typeof signal + ") " + signal.toString() + " and callback: " + typeof callback;
        },

        _super: function(funcName) {
            return (this.constructor.__super__[funcName] && _.isFunction(this.constructor.__super__[funcName]))
                   ? this.constructor.__super__[funcName].apply(this, _.rest(arguments))
                   : (this.constructor.__super__[funcName]) ? this.constructor.__super__[funcName] : undefined;
        }
    },
    decorateAll: {
        init_signals: function(){
            var args = _.toArray(arguments);
    //        console.log('Running signal init on %o', this);
            if (this.signals) {
    //            console.log('I have these signals: %o', signals);
                _.each(this.signals, function(list, signal){
                    _.each(list, function(callback){
                        this.connect(signal, callback);
                    }, this);
                }, this);
            }
            args.unshift('preInit');
            this.signal && this.signal.apply(this, args);
        },
        initialize: {
            before: this.init_signals,
            after: function(){
                var args = _.toArray(arguments);
        //        console.log('Running initialize after function.');
                args.unshift('postInit');
                this.signal && this.signal.apply(this, args);
            }
        }
    },

    sharedMethods: {

        normalizeDates: function(attrs, options){
            var payload = {};
            _.each(attrs||this.attributes, function(val, name){
                payload[name] = (~name.toLowerCase().indexOf('date')) ? _.normalize_date(val) : val;
            }, this);
            return payload;
        },

        detectChanges: function(){
    //        console.log('detectChanges running!');
            if (!this.initialData) {
    //            console.log('no initialData. setting it and lastDetectChanges then exiting. %o', this);
                this.initialData = JSON.stringify(this.toJSON());
                this.lastDetectChanges = (new Date).getTime();
                return void 0;
            }
            var time_diff = this.detectChanges ? (new Date).getTime() - this.lastDetectChanges : null;
    //        console.log('detectChanges called after %s milliseconds', time_diff);
            if (this.lastDetectChanges && (time_diff < 150)) {
    //            console.log('not enough time elapsed. updating initialData then exiting.');
                this.initialData = JSON.stringify(this.toJSON());
                return void 0;
            }
            if (JSON.stringify(this.toJSON()) != this.initialData) {
    //            console.log('data has changed!');
                this.set({save_action: 'save'});
            }
            this.lastDetectChanges = (new Date).getTime();
        },

    }
};


/*App.Backbone.decorateAll.render = {
    before: function(){
//        console.log('firing preRender');
        this.signal('preRender');
    },
    after: function(){
//        console.log('firing postRender');
        this.signal('postRender');
    }
};*/
// End decorateAll

App.Backbone.TemplateView = Backbone.View.extend({
    /**
     * Initializes the templates
     * @param options
     * options.templates should be an Array of Arrays with the structure [id, (optional) name]
     */

    events: {
        "click .error input": "initClearErrors",
        "focus .error input": "initClearErrors"
    },

    initTemplates: function() {
//        console.log('Running TemplateView.initTemplates');
        var templates = this.templates||[];
//        if (is_ing) console.log('I have these templates: %o', templates);
        if (templates && templates.length) {
            for (var i=0, j=templates.length; i<j; i++) {
//                if (this instanceof App.Backbone.Views.Contact) console.log('Template: %o', templates[i]);
                this.initTemplate.apply(this, templates[i]);
            }
        }
        return this;
    },

    initTemplate: function(id, name, overwrite) {
        var key = name||'main',
            templates = this._templates || (this._templates = {}),
            container = templates[key] || (templates[key] = {}),
            tpl_element = document.getElementById(id);
        if (!overwrite && container.template && container.renderer) {
//            console.log('template already exists!');
            return;
        }
        container.template = (tpl_element) ? tpl_element.innerHTML : '';
        container.renderer = _.template(container.template);
//        console.log('new template object %o stored!', container);
        return this;
    },

    getTemplate: function(name) {
        var name = name||'main';
        if (!this._templates) {
//            console.error('no templates found!');
            return {};
        }
        if (this._templates[name] && this._templates[name].renderer) {
            
            return this._templates[name];
        }
        return {};
    },

    renderTemplate: function(template_name, data) {
        var name = template_name || 'main',
            model = data || null,
            allowEmpty = arguments[2] || false,
            template =  this.getTemplate(name),
//            is_ing = (this.uuid == App.Blend.IngredientView.prototype.uuid || this.uuid == App.Blend.SeedIngredientView.prototype.uuid),
            output;
        if (!model) {
             model = (this.model) ? this.model.toJSON() : (this.collection || null);
//            if (is_ing) console.log('Had to retrieve data from model or collection as no data was passed.');
//            if (is_ing) console.log('No object to render to the template: %o', typeof model);
        }
//        console.log('running renderTemplate with args: %o, model: %o and template: %o', arguments, model, template);
        if (!model && !allowEmpty) {
//            console.log('No model in renderTemplate! Aborting.');
            return;
        }
        output = (template && template.renderer) ? template.renderer(model||{}) : '';
//        if (name == 'main' && model instanceof App.Backbone.Models.Contact) console.log("Rendered template: '%s' and got: '%s'", name, output.substr(0, 200));
        return output;
    },

    render: function(no_signals) {
//        console.log('Running TemplateView.render');
        var template = this.getTemplate() || null,
            model = (this.model||this.collection);
        if (!no_signals && this.signal) this.signal('preRender');
        if (template && template.renderer && model){
//            console.log('Rendering template %o to this.el %o using data from %o', this.getTemplate(), this.el, (this.model||this.collection));
            $(this.el).html(this.renderTemplate());
        } else {
//            console.log('I have no model or no template! Template: %o', template||{});
        }

        if (!no_signals && this.signal) this.signal('postRender');
        return this;
    },

    initClearErrors: function(event){
        $(event.target).one('change', function(){
            $(this).closest('.error').removeClass('error').removeAttr('data-error');
        });
    }

});

App.Backbone.UpdatingCollection = Backbone.Collection.extend({

    initialItems: function() {
        return _.filter(this.models, function(model){ return !model.isNew(); }).length;
    },

    add: function(models, options) {
        var models = models || {};
        _.each((_.isArray(models) ? models : [models]), function(model){
            var index = this.length;
            if (model instanceof Backbone.Model) {
                model.attributes.index = index;
            } else {
                model.index = index;
            }
            model = this._add(model, options);
        }, this);
        return this;
    },

    remove: function(models, options) {
        _.each((_.isArray(models) ? models : [models]), function(model){
            Backbone.Collection.prototype.remove.call(this, model, options);
        }, this);
        _.each(this.models, function(model, index){
            if (index < this.length-1) {
                model.set({'index': index}, {silent: true});
            } else {
                model.set({'index': index});
            }
        }, this);
        return this;
    }
});

// Extend all of our Models, Views and Collections with a Django inspired signal system and easier __super__ access
_.each(App.Backbone, function(obj, name){
    var testObj = (_.isFunction(obj)) ? new obj({noChildInit: true}) : false;
    if (testObj && testObj instanceof Backbone.Model || testObj instanceof Backbone.View || testObj instanceof Backbone.Collection) {
        _.each(App.Backbone.extendAll, function(method, name){
//            console.log('Adding %s method to prototype', name);
            if (!this.prototype[name]) this.prototype[name] = method;
        }, obj);

        _.each(App.Backbone.decorateAll, function(options, name){
            if (obj.prototype[name]) {
//                console.log('Decorating %s method %o with %o', name, obj.prototype[name], options);
                App.Decorator.decorateMethod(this.prototype, name, options);
            }
        }, obj);
    }
});

App.Backbone.UpdatingCollectionView = App.Backbone.TemplateView.extend({

    add : function(model) {
//        console.log('Adding view for %s', model.get('description')||'[unknown]');
        var childView = new this._childViewConstructor({
            tagName : this._childViewTagName,
            model : model
        });
//        console.log('Child view cid is %s and model cid is %s', childView.cid, model.cid);
        this._childViews.push(childView);

        if (this._rendered) {
            var child_el = childView.render().el;
//            console.log('Adding child: %o to this.el: %o', child_el, this.el);
            $(this.el).append(child_el);
        } else {
            this.render();
        }
    },

    initialize: function(options) {
        var pre = _.bind(App.Backbone.decorateAll.initialize.before, this);
        pre(options, this.uuid);
        this.initTemplates(options);
//        console.log('Running UpdatingCollectionView.initialize with options: %o', options||{});
        _(this).bindAll('add', 'remove');

        if (!options.noChildInit) {
//            console.log('Setting up childViewConstructor and childViewTagName');
            if (!options.childViewConstructor && !this._childViewConstructor) throw "no child view constructor provided";
            if (!options.childViewTagName && !this._childViewTagName) throw "no child view tag name provided";

            options.childViewConstructor && (this._childViewConstructor = options.childViewConstructor);
            options.childViewTagName && (this._childViewTagName = options.childViewTagName);
        }


        this._childViews = [];

        if (this.collection) this._initCollection();
        
        this.signal('postInit');
    },

    remove : function(model) {
        var viewToRemove = _(this._childViews).select(function(cv) {
            return cv.model === model;
        })[0];
        this._childViews = _(this._childViews).without(viewToRemove);

        if (this._rendered) $(viewToRemove.el).remove();
    },

    render : function() {
//        console.log('Running UpdatingCollectionView.render');
        this._rendered = true;

        $(this.el).empty().html(this.renderTemplate());

        _(this._childViews).each(function(childView, index) {
//            console.log('rendering view %s', index||0);
            var childEl = childView.render().el;
//            console.log(childEl);
            $(this.el).append(childEl);
        }, this);
//
//        console.log('My element is %o', this.el);
        return this;
    },

    _initCollection: function() {
        this.collection.each(this.add);

        this.collection.bind('add', this.add);
        this.collection.bind('remove', this.remove);
        this.collection.bind('change:index', function(){
            this._rendered = false;
//            console.log('Index change has triggered re-render.');
            this.render();
        }, this);
    }

});
//App.Decorator.decorateMethod(App.Backbone.UpdatingCollectionView.prototype, 'initialize', App.Backbone.decorateAll.initialize);

App.Backbone.BoundView = App.Backbone.TemplateView.extend({
    initModelBindings: function(bindings){
//        console.log('Model is %o', this.model);
//        console.log('modelBindings are %o', this.modelBindings||{});
        if (this.model!=null && (this.modelBindings!=null || bindings!=null)) {
//            console.log('initializing model bindings for %s', this.model.cid);
            _.each(bindings||this.modelBindings, function(field, selector){
                var model_event = "change:"+field,
                    selArray = selector.split(" "),
                    form_event = selArray.shift(),
                    final_selector = selArray.join(" "),
                    $el = $(final_selector, this.el);
//                console.log('setting up 2-way binding between %s (%o) and model field %s', final_selector, $el, field);
//                console.log('browser event is %s', form_event);
                //When the model is updated, update the form
                this.model.bind(model_event, function(model, val){
                    var $el = this.$(final_selector), el = ($el.length > 0) ? $el[0] : null;
                    if (field == 'pls_quantity') console.log('setting "%s" value to %s because model\'s "%s" changed', final_selector, val, field);
                    if (el && _.isBoolean(val) && el.type == 'checkbox') return el.checked = val, $el.change();
                    if (el) return $el.val(val);
                }, this);

                //When the form is updated, update the model
                $(this.el).delegate(final_selector, form_event, _.bind(function(event){
                    var el = event.target,
                        tag = el.tagName.toLowerCase(),
                        type = el.type,
                        $el = this.$(event.target),
                        data = {};
                    data[field] = (type && type == 'checkbox' && el.value == 'on') ? el.checked : $el.val();
//                    console.log('setting "%s" value to %s because model\'s "%s" changed', field, data[field], final_selector);
                    this.model.set(data);
                }, this));

            }, this);
        } else {

        }
        return this;
    },

    render: function(){
//        console.log('rendering BoundView');
        this.signal('preRender');
        this.initTemplates();
        App.Backbone.TemplateView.prototype.render.call(this, true);
        this.initModelBindings().delegateEvents();
        this.signal('postRender');
        return this;
    }
});

App.Backbone.BoundCollectionView = App.Backbone.TemplateView.extend({
    initCollectionBindings: function(){
        if (this.collection && this.collectionBindings!=null) {
            _.each(this.collectionBindings, function(field, selector){
                var model_event = "change:"+field,
                    selArray = selector.split(" "),
                    form_event = selArray.shift(),
                    final_selector = selArray.join(" ");
//                console.log('model event: %s, form event: %s, form selector: %s', model_event, form_event, final_selector);
                //When the model is updated, update the form
                this.collection.bind(model_event, _.bind(function(model, val){
                    this.$(final_selector).val(val);
                }, this));

                //When the form is updated, update the model
                this.$(final_selector).bind(form_event, _.bind(function(event){
                    var data = {};
                    data[field] = this.$(ev.target).val();
                    this.model.set(data);
                }, this));
            });
        }
        return this;
    },

    render: function(){
        this.signal('preRender');
        this.initTemplates();
        App.Backbone.TemplateView.prototype.render.call(this, true);
        this.initCollectionBindings().delegateEvents();
        this.signal('postRender');
        return this;
    }
});

App.Decorator.decorateMethod(Backbone.Model.prototype, 'initialize', App.Backbone.decorateAll.initialize);

//App.Decorator.decorateMethod(Backbone.Model.prototype, 'save', App.Backbone.decorateAll.save);

App.Decorator.decorateMethod(Backbone.Collection.prototype, 'initialize', App.Backbone.decorateAll.initialize);

//App.Decorator.decorateMethod(Backbone.Collection.prototype, 'save', App.Backbone.decorateAll.save);

_.each(App.Backbone.extendAll, function(func, name) {
    Backbone.Model.prototype[name] = func;
    App.Backbone.UpdatingCollectionView.prototype[name] = func;
});


//_.each(App.Backbone, App.addUuidToPrototype);
