var TileMill = TileMill || { settings:{}, page:0, uniq: (new Date().getTime()), editor: {}, basic: { stylesheet: '' } };

$.fn.reverse = [].reverse;

TileMill.save = function() {
  // No need to save MML, it's always the same.
  TileMill.basic.stylesheet = "/* { 'label': '" + TileMill.basic.label + "', 'visualizationType': '" + TileMill.basic.visualizationType + "', 'visualizationField': '" + TileMill.basic.visualizationField + "' } */\n";

  TileMill.basic.stylesheet += "Map {\n  map-bgcolor: #fff;\n}\n#world {\n  polygon-fill: #eee;\n  line-color: #ccc;\n  line-width: 0.5;\n}\n#inspect {\n  polygon-fill: #83bc69;\n  line-color: #333;\n  line-width: 0.5;\n}";

  if (TileMill.basic.label) {
    TileMill.basic.stylesheet += "\n#inspect " + TileMill.basic.label + "{\n  text-face-name: \"DejaVu Sans Book\";\n  text-fill: #333;\n  text-size: 9;\n}";
  }

  if (TileMill.basic.visualizationType == 'choropleth' || TileMill.basic.visualizationType == 'unique') {
    var field = TileMill.basic.visualizationField;
    if (TileMill.inspector.valueCache[field]) {
      TileMill.basic[TileMill.basic.visualizationType](TileMill.inspector.valueCache[field]);

      TileMill._save();
    }
    else {
      TileMill.inspector.values(field, 'inspect', 'TileMill.basic.' + TileMill.basic.visualizationType, (TileMill.basic.visualizationType == 'unique' ? 50 : false));
    }
  }
  else {
    TileMill._save();
  }
}

TileMill._save = function() {
  // Todo: implement chloropleth, unique value.
  TileMill.stylesheet.save(TileMill.settings.project_id, TileMill.basic.stylesheet);
  TileMill.uniq = (new Date().getTime());
  TileMill.map.reload();
}

TileMill.basic.choropleth = function(data) {
  var range = Math.abs(data.max - data.min),
    split = TileMill.settings.choroplethSplit ? TileMill.settings.choroplethSplit : 3,
    individual = range / split,
    colors = {
    2: [],
    3: ['#edaeae', '#e86363', '#f60000'],
    4: [],
    5: [],
    6: [],
    7: [],
    8: [],
    9: [],
    10: []
  };
  for (i = 0; i < split; i++) {
    TileMill.basic.stylesheet += "\n#inspect[" + TileMill.basic.visualizationField + ">=" + data.min + (individual * i) + "] {\n  polygon-fill: " + colors[split][i] + ";\n}";
  }
  TileMill._save();
}

TileMill.basic.unique = function(data) {
  var colors = [
      '#edaeae',
      '#e86363',
      '#f60000'
    ], processed = [];
  for (i = 0; i < data.values.length; i++) {
    var pass = false;
    for (j = 0; j < processed.length; j++) {
      if (processed[j] == data.values[i]) {
        pass = true;
        continue;
      }
    }
    if (!pass) {
      TileMill.basic.stylesheet += "\n#inspect[" + TileMill.basic.visualizationField + "='" + data.values[i] + "'] {\n  polygon-fill: " + colors[i % colors.length] + ";\n}";
      processed.push(data.values[i]);
    }
  }
  TileMill._save();
}

$(function() {
  $('div#header a.save').click(function() {
    TileMill.save();
    return false;
  });

  $('div#header a.info').click(function() {
    $('#popup-info input#tilelive-url').val(TileMill.settings.tilelive.split(',')[0] + 'tile/' + TileMill.mml.url({ timestamp: false, encode: true }));
    $('#popup-info input#project-mml-url').val(TileMill.mml.url({ timestamp: false, encode: false }));
    TileMill.popup.show({content: $('#popup-info'), title: 'Info'});
    return false;
  });
  TileMill.inspector.loadCallback = function(data) {
    $('.layer-inspect-loading').removeClass('layer-inspect-loading').addClass('layer-inspect');
    for (field in data['inspect']) {
      (function(field, data) {
        var li = $('<li>')
          .attr('id', 'field-' + field)
          .append($('<a class="inspect-unique" href="#inspect-unique">Unique Value</a>').click(function() {
            if ($(this).is('.active')) {
              delete TileMill.basic.visualizationField;
              delete TileMill.basic.visualizationType;
              $(this).removeClass('active');
            }
            else {
              TileMill.basic.visualizationField = field;
              TileMill.basic.visualizationType = 'unique';
              $('#inspector a.inspect-choropleth, #inspector a.inspect-unique').removeClass('active');
              $(this).addClass('active');
            }
            TileMill.save();
            return false;
          }))
          .append($('<a class="inspect-values" href="#inspect-values">See values</a>').click(function() {
            TileMill.inspector.values(field, 'inspect');
            return false;
          }))
          .append($('<a class="inspect-label" href="#inspect-label">Label</a>').click(function() {
            if ($(this).is('.active')) {
              delete TileMill.basic.label;
              $(this).removeClass('active');
            }
            else {
              TileMill.basic.label = field;
              $('#inspector a.inspect-label').removeClass('active');
              $(this).addClass('active');
            }
            TileMill.save();
            return false;
          }));
        // Only show choropleth for int and float fields.
        if (data['inspect'][field] == 'int' || data['inspect'][field] == 'float') {
          li.append($('<a class="inspect-choropleth" href="#inspect-choropleth">Choropleth</a>').click(function() {
            if ($(this).is('.active')) {
              delete TileMill.basic.visualizationField;
              delete TileMill.basic.visualizationType;
              $(this).removeClass('active');
            }
            else {
              TileMill.basic.visualizationField = field;
              TileMill.basic.visualizationType = 'choropleth';
              $('#inspector a.inspect-choropleth, #inspector a.inspect-unique').removeClass('active');
              $(this).addClass('active');
            }
            TileMill.save();
            return false;
          }));
        }
        li.append('<strong>' + field + '</strong>')
          .append('<em>' + data['inspect'][field].replace('int', 'integer').replace('str', 'string') + '</em>')
          .appendTo($('#inspector ul.sidebar-content'));

      })(field, data);
    }
    var src = $('Stylesheet:first', TileMill.settings.mml).attr('src');
    // If there is no / character, assume this is a single filename.
    if (src.split('/').length === 1) {
      src = TileMill.settings.server + 'projects/mss?id='+ TileMill.settings.project_id +'&filename='+ filename;
    }
    $.get(src, function(data) {
      var settings = eval('(' + data.match(/(.+)/)[0].replace('/*', '').replace('*/', '') + ')');
      if (settings.label != 'undefined') {
        TileMill.basic.label = settings.label;
        $('#field-' + settings.label).find('.inspect-label').addClass('active');
      }
      if (settings.visualizationField != 'undefined') {
        TileMill.basic.visualizationField = settings.visualizationField;
        TileMill.basic.visualizationType = settings.visualizationType;
        $('#field-' + settings.visualizationField).find('.inspect-' + settings.visualizationType).addClass('active');
      }
    });
  };
  TileMill.inspector.load();
  $('#layers').hide();

  $('div#header a.info').click(function() {
    $('#popup-info input#tilelive-url').val(TileMill.settings.tilelive + 'tile/' + TileMill.mml.url({ timestamp: false, encode: true }));
    $('#popup-info input#project-mml-url').val(TileMill.mml.url({ timestamp: false, encode: false }));
    TileMill.popup.show({content: $('#popup-info'), title: 'Info'});
    return false;
  });
});