/* ***********************************************************************************************

    Unify Project

    Homepage: unify-project.org
    License: MIT + Apache (V2)
    Copyright: 2009-2010 Deutsche Telekom AG, Germany, http://telekom.com

*********************************************************************************************** */
/**
 * This class adds a lot of functionality to work together with business
 * objects which extend {@link unify.business.RemoteData}. It comes
 * with intelligent managment of the content and tries to reduce the
 * data loaded from remote to a minimum. It integrates activity indicators
 * to give the user feedback about server communication.
 */
qx.Class.define("unify.view.mobile.RemoteView",
{
  extend : unify.view.mobile.ServiceView,
  type : "abstract",



  /*
  *****************************************************************************
     CONSTRUCTOR
  *****************************************************************************
  */

  construct : function()
  {
    this.base(arguments);

    // Connect business object
    this._getBusinessObject().addListener("completed", this.__onBusinessObjectCompleted, this);
  },



  /*
  *****************************************************************************
     MEMBERS
  *****************************************************************************
  */

  members :
  {
    /** {String} Version of cache which was used to render current view */
    __appliedVersion : undefined,

    /** {String} Used internally to store the rendered variant. Needs to be undefined for views without parameters */
    __appliedVariant : undefined,

    /** {Integer} ID of request. Used to identify requests in completed events */
    __requestId : null,



    /*
    ---------------------------------------------------------------------------
      PUBLIC API
    ---------------------------------------------------------------------------
    */

    /**
     * Reloads the data of the view
     */
    refresh : function()
    {
      if (this.__requestId)
      {
        this.warn("Request is already running!");
        return;
      }

      this.__requestId = this._getBusinessObject().get(this._getServiceName(), this._getServiceParams());
      if (this.__requestId !== false) {
        unify.ui.mobile.ActivityIndicator.getInstance().show();
      }
    },



    /*
    ---------------------------------------------------------------------------
      INTERNALS
    ---------------------------------------------------------------------------
    */
    
    
    /**
     * Whether the view has all required parameters to send a request to
     * the server.
     * 
     * @return {Boolean} Whether the view has all required request data
     */
    _hasServiceRequestParams : function() {
      return true;
    },
    

    /**
     * Applies updates to the view
     *
     * Should be called whenever the view is active and the result of
     * {@link #_getRenderVariant} changes or at the moment a view gets
     * active. Changes should not be applied during the view being
     * invisible.
     *
     * This method automatically checks the version of the
     * cache which was used for a previous rendering to automatically
     * handle refreshes.
     */
    _checkStatus : function()
    {
      if (!this._hasServiceRequestParams()) {
        return;
      }

      var business = this._getBusinessObject();
      var service = this._getServiceName();
      var params = this._getServiceParams();
      
      var renderVariant = this._getRenderVariant();
      if (renderVariant !== this.__appliedVariant)
      {
        // this.debug("New render variant: " + renderVariant);

        var cachedEntry = business.getCachedEntry(service, params);
        if (cachedEntry != null)
        {
          // this.debug("Render cache value (ignoring age)...")
          this.__appliedVariant = renderVariant;
          this.__appliedVersion = cachedEntry.created;

          this._wrappedRenderData(cachedEntry.data);
        }

        if (!cachedEntry || !business.isCacheValid(service, params))
        {
          // this.debug("Cache was " + (cachedEntry ? "old" : "empty") + ". Loading data...");
          this.refresh();
        }
      }
      else
      {
        // this.debug("Same variant...");

        if (business.isCacheValid(service, params))
        {
          // this.debug("Cache is valid!")

          var cachedEntry = business.getCachedEntry(service, params);
          if (cachedEntry.created > this.__appliedVersion)
          {
            // this.debug("Cache is newer than rendered view => render with new cached data...");
            // this.debug("Rendered=" + this.__appliedVersion + " vs. Cache=" + cachedEntry.id);
            this.__appliedVersion = cachedEntry.created;
            this._wrappedRenderData(cachedEntry.data);
          }
        }
        else
        {
          // this.debug("No valid cache available. Was cleared?");
          this.refresh();
        }
      }
    },


    /**
     * Event listener for "completed" event of business object.
     *
     * @param e {unify.business.CompletedEvent} Event object
     */
    __onBusinessObjectCompleted : function(e)
    {
      if (e.getId() !== this.__requestId) {
        return;
      }

      delete this.__requestId;
      unify.ui.mobile.ActivityIndicator.getInstance().hide();

      if (e.isErrornous()) {
        this._errorHandler("communication", e.getRequest().getStatusCode());
      } else if (e.isMalformed()) {
        this._errorHandler("data");
      } else if (e.isModified()) {
        this._wrappedRenderData(e.getData());
      } else if (qx.core.Variant.isSet("qx.debug", "on")) {
        this.debug("Data was not modified!");
      }
    }
  },



  /*
  *****************************************************************************
     DESTRUCTOR
  *****************************************************************************
  */

  destruct : function()
  {
    var business = this._getBusinessObject();
    if (business) {
      business.removeListener("completed", this.__onBusinessObjectCompleted, this);
    }
  }
});
