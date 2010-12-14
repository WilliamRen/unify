/* ************************************************************************

  googly

  Copyright:
    2009 Deutsche Telekom AG, Germany, http://telekom.com

 ************************************************************************ */

/**
 * Answers View
 */
qx.Class.define("googly.view.WeatherSearch", 
{
  extend : unify.view.RemoteView,
  type : "singleton",

  members : 
  {
    // overridden
    getTitle : function(type, param) {
      return "Weather Search";
    },
    
    
    // overridden
    isModal : function() {
      return true;
    },
    
    
    // overridden
    _getBusinessObject : function() {
      return googly.business.Yql.getInstance();
    },
    

    // overridden
    _getServiceName : function() {
      return "weather";
    },
    

    // overridden
    _errorHandler : function(kind) {
      this.error("Error: " + kind);
    },
    

    // overridden
    _getServiceParams : function() 
    {
      var field = document.getElementById("citySearch");
      if (!field) {
        return;
      }
      
      unify.storage.Simple.setItem("weather/city", field.value);
      
      return {
        city : field.value
      };
    },
    
    
    // overridden
    _hasServiceRequestParams : function()
    {
      var field = document.getElementById("citySearch");
      return field && field.value.length > 0;
    },
    
    
    // overridden
    _createView : function() 
    {
      var layer = new unify.ui.Layer(this);
      var titlebar = new unify.ui.TitleBar(this);
      layer.add(titlebar);
      
      var content = new unify.ui.Content;
      content.add("<input type='text' id='citySearch'/><div class='button' exec='refresh'>Search</div><div id='citySearchFeedback'></div>");
      layer.add(content);

      return layer;
    },
    
    
    // overridden
    _renderData : function(data)
    {
      var results = data.query.results;
      if (results)
      {
        document.getElementById("citySearchFeedback").innerHTML = "Redirecting...";
        
        var self = this;
        window.setTimeout(function() {
          self.close();
        }, 500);
      }
      else
      {
        document.getElementById("citySearchFeedback").innerHTML = "Could not find searched location!";
      }
    },
    
    
    /**
     * Returns the selected city
     */
    getCity : function() {
      return unify.storage.Simple.getItem("weather/city");
    }
  }
});
