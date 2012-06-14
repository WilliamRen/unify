/* ========================================================================

   qooxdoo - the new era of web development

   http://qooxdoo.org

   Copyright:
     2004-2008 1&1 Internet AG, Germany, http://www.1und1.de

   License:
     LGPL: http://www.gnu.org/licenses/lgpl.html
     EPL: http://www.eclipse.org/org/documents/epl-v10.php
     See the LICENSE file in the project's top-level directory for details.

   Authors:
     * Sebastian Werner (wpbasti)
     * Fabian Jakobs (fjakobs)

======================================================================== */



core.Module("unify.ui.layout.Util", {
    
  /**
   * {Integer} Calculate left gap of @widget {unify.ui.core.Widget}
   */
  calculateLeftGap : function(widget) {
    return widget.getBorder().left + widget.getMarginLeft() || 0;
  },

  /**
   * {Integer} Calculate top gap of @widget {unify.ui.core.Widget}
   */
  calculateTopGap : function(widget) {
    return widget.getBorder().top + widget.getMarginTop() || 0;
  },
  
  /**
   * {Integer} Calculate right gap of @widget {unify.ui.core.Widget}
   */
  calculateRightGap : function(widget) {
    return widget.getBorder().right + widget.getMarginRight() || 0;
  },
  
  /**
   * {Integer} Calculate bottom gap of @widget {unify.ui.core.Widget}
   */
  calculateBottomGap : function(widget) {
    return widget.getBorder().bottom + widget.getMarginBottom() || 0;
  },
  
  /**
   * {Integer} Calculate horizontal gap of @widget {unify.ui.core.Widget}
   */
  calculateHorizontalGap : function(widget) {
    var border = widget.getBorder();
    return border.left + widget.getMarginLeft() + border.right + widget.getMarginRight() || 0;
  },
  
  /**
   * {Integer} Calculate vertical gap of @widget {unify.ui.core.Widget}
   */
  calculateVerticalGap : function(widget) {
    var border = widget.getBorder();
    return border.top + widget.getMarginTop() + border.bottom + widget.getMarginBottom() || 0;
  },
  
  /** {Regexp} Regular expression to match percent values */
  PERCENT_VALUE : /[0-9]+(?:\.[0-9]+)?%/,
  
  /**
   * {Map} Computes the flex offsets needed to reduce the space
   * difference as much as possible by respecting the
   * potential of the given elements (being in the range of
   * their min/max values)
   *
   * @flexibles {Map} Each entry must have these keys:
   *   <code>id</code>, <code>potential</code> and <code>flex</code>.
   *   The ID is used in the result map as the key for the user to work
   *   with later (e.g. upgrade sizes etc. to respect the given offset)
   *   The potential is an integer value which is the difference of the
   *   currently interesting direction (e.g. shrinking=width-minWidth, growing=
   *   maxWidth-width). The flex key holds the flex value of the item.
   * @avail {Integer} Full available space to allocate (ignoring used one)
   * @used {Integer} Size of already allocated space
   */
  computeFlexOffsets : function(flexibles, avail, used) {
    var child, key, flexSum, flexStep;
    var grow = avail > used;
    var remaining = Math.abs(avail - used);
    var roundingOffset, currentOffset;


    // Preprocess data
    var result = {};
    for (key in flexibles)
    {
      child = flexibles[key];
      result[key] =
      {
        potential : grow ? child.max - child.value : child.value - child.min,
        flex : grow ? child.flex : 1 / child.flex,
        offset : 0
      }
    }


    // Continue as long as we need to do anything
    while (remaining != 0)
    {
      // Find minimum potential for next correction
      flexStep = Infinity;
      flexSum = 0;
      for (key in result)
      {
        child = result[key];

        if (child.potential > 0)
        {
          flexSum += child.flex;
          flexStep = Math.min(flexStep, child.potential / child.flex);
        }
      }


      // No potential found, quit here
      if (flexSum == 0) {
        break;
      }


      // Respect maximum potential given through remaining space
      // The parent should always win in such conflicts.
      flexStep = Math.min(remaining, flexStep * flexSum) / flexSum;


      // Start with correction
      roundingOffset = 0;
      for (key in result)
      {
        child = result[key];

        if (child.potential > 0)
        {
          // Compute offset for this step
          currentOffset = Math.min(remaining, child.potential, Math.ceil(flexStep * child.flex));

          // Fix rounding issues
          roundingOffset += currentOffset - flexStep * child.flex;
          if (roundingOffset >= 1)
          {
            roundingOffset -= 1;
            currentOffset -= 1;
          }

          // Update child status
          child.potential -= currentOffset;

          if (grow) {
            child.offset += currentOffset;
          } else {
            child.offset -= currentOffset;
          }

          // Update parent status
          remaining -= currentOffset;
        }
      }
    }

    return result;
  },
  
  /**
   * {Integer} Computes the offset which needs to be added to the top position
   * to result in the stated vertical alignment. Also respects
   * existing margins (without collapsing).
   *
   * @align {String} One of <code>top</code>, <code>center</code> or <code>bottom</code>.
   * @width {Integer} The visible width of the widget
   * @availWidth {Integer} The available inner width of the parent
   * @marginLeft {Integer?0} Optional left margin of the widget
   * @marginRight {Integer?0} Optional right margin of the widget
   */
  computeHorizontalAlignOffset : function(align, width, availWidth, marginLeft, marginRight)
  {
    if (marginLeft == null) {
      marginLeft = 0;
    }

    if (marginRight == null) {
      marginRight = 0;
    }

    var value = 0;
    switch(align)
    {
      case "left":
        value = marginLeft;
        break;

      case "right":
        // Align right changes priority to right edge:
        // To align to the right is more important here than to left.
        value = availWidth - width - marginRight;
        break;

      case "center":
        // Ideal center position
        value = Math.round((availWidth - width) / 2);

        // Try to make this possible (with left-right priority)
        if (value < marginLeft) {
          value = marginLeft;
        } else if (value < marginRight) {
          value = Math.max(marginLeft, availWidth-width-marginRight);
        }

        break;
    }

    return value;
  },


  /**
   * {Integer} Computes the offset which needs to be added to the top position
   * to result in the stated vertical alignment. Also respects
   * existing margins (without collapsing).
   *
   * @align {String} One of <code>top</code>, <code>middle</code> or <code>bottom</code>.
   * @height {Integer} The visible height of the widget
   * @availHeight {Integer} The available inner height of the parent
   * @marginTop {Integer?0} Optional top margin of the widget
   * @marginBottom {Integer?0} Optional bottom margin of the widget
   */
  computeVerticalAlignOffset : function(align, height, availHeight, marginTop, marginBottom)
  {
    if (marginTop == null) {
      marginTop = 0;
    }

    if (marginBottom == null) {
      marginBottom = 0;
    }

    var value = 0;
    switch(align)
    {
      case "top":
        value = marginTop;
        break;

      case "bottom":
        // Align bottom changes priority to bottom edge:
        // To align to the bottom is more important here than to top.
        value = availHeight - height - marginBottom;
        break;

      case "middle":
        // Ideal middle position
        value = Math.round((availHeight - height) / 2);

        // Try to make this possible (with top-down priority)
        if (value < marginTop) {
          value = marginTop;
        } else if (value < marginBottom) {
          value = Math.max(marginTop, availHeight-height-marginBottom);
        }

        break;
    }

    return value;
  },


  /**
   * {Integer} Collapses two margins.
   *
   * Supports positive and negative margins.
   * Collapsing find the largest positive and the largest
   * negative value. Afterwards the result is computed through the
   * subtraction of the negative from the positive value.
   *
   * @varargs {arguments} Any number of configured margins
   */
  collapseMargins : function(varargs)
  {
    var max=0, min=0;
    for (var i=0, l=arguments.length; i<l; i++)
    {
      var value = arguments[i];

      if (value < 0) {
        min = Math.min(min, value);
      } else if (value > 0) {
        max = Math.max(max, value);
      }
    }

    return max + min;
  },


  /**
   * {Integer} Computes the sum of all horizontal gaps. Normally the
   * result is used to compute the available width in a widget.
   *
   * The method optionally respects margin collapsing as well. In
   * this mode the spacing is collapsed together with the margins.
   *
   * @children {Array} List of children
   * @spacing {Integer?0} Spacing between every child
   * @collapse {Boolean?false} Optional margin collapsing mode
   */
  computeHorizontalGaps : function(children, spacing, collapse)
  {
    if (spacing == null) {
      spacing = 0;
    }

    var gaps = 0;

    if (collapse)
    {
      // Add first child
      gaps += children[0].getMarginLeft();

      for (var i=1, l=children.length; i<l; i+=1) {
        gaps += this.collapseMargins(spacing, children[i-1].getMarginRight(), children[i].getMarginLeft());
      }

      // Add last child
      gaps += children[l-1].getMarginRight();
    }
    else
    {
      // Simple adding of all margins
      for (var i=1, l=children.length; i<l; i+=1) {
        gaps += children[i].getMarginLeft() + children[i].getMarginRight();
      }

      // Add spacing
      gaps += (spacing * (l-1));
    }

    return gaps;
  },


  /**
   * {Integer} Computes the sum of all vertical gaps. Normally the
   * result is used to compute the available height in a widget.
   *
   * The method optionally respects margin collapsing as well. In
   * this mode the spacing is collapsed together with the margins.
   *
   * @children {Array} List of children
   * @spacing {Integer?0} Spacing between every child
   * @collapse {Boolean?false} Optional margin collapsing mode
   */
  computeVerticalGaps : function(children, spacing, collapse)
  {
    if (spacing == null) {
      spacing = 0;
    }

    var gaps = 0;

    if (collapse)
    {
      // Add first child
      gaps += children[0].getMarginTop();

      for (var i=1, l=children.length; i<l; i+=1) {
        gaps += this.collapseMargins(spacing, children[i-1].getMarginBottom(), children[i].getMarginTop());
      }

      // Add last child
      gaps += children[l-1].getMarginBottom();
    }
    else
    {
      // Simple adding of all margins
      for (var i=1, l=children.length; i<l; i+=1) {
        gaps += children[i].getMarginTop() + children[i].getMarginBottom();
      }

      // Add spacing
      gaps += (spacing * (l-1));
    }

    return gaps;
  },


  /**
   * {Integer} Computes the gaps together with the configuration of separators.
   *
   * @children {Array} List of children
   * @spacing {Integer} Configured spacing
   * @separator {var} Separator to render
   */
  computeHorizontalSeparatorGaps : function(children, spacing, separator)
  {
    var instance = qx.theme.manager.Decoration.getInstance().resolve(separator);
    var insets = instance.getInsets();
    var width = insets.left + insets.right;

    var gaps = 0;
    for (var i=0, l=children.length; i<l; i++)
    {
      var child = children[i];
      gaps += child.getMarginLeft() + child.getMarginRight();
    }

    gaps += (spacing + width + spacing) * (l-1);

    return gaps;
  },


  /**
   * {Integer} Computes the gaps together with the configuration of separators.
   *
   * @children {Array} List of children
   * @spacing {Integer} Configured spacing
   * @separator {var} Separator to render
   */
  computeVerticalSeparatorGaps : function(children, spacing, separator)
  {
    var instance = qx.theme.manager.Decoration.getInstance().resolve(separator);
    var insets = instance.getInsets();
    var height = insets.top + insets.bottom;

    var gaps = 0;
    for (var i=0, l=children.length; i<l; i++)
    {
      var child = children[i];
      gaps += child.getMarginTop() + child.getMarginBottom();
    }

    gaps += (spacing + height + spacing) * (l-1);

    return gaps;
  },


  /**
   * {Map} Arranges two sizes in one box to best respect their individual limitations.
   *
   * Mainly used by split layouts (Split Panes) where the layout is mainly defined
   * by the outer dimensions.
   *
   * @beginMin {Integer} Minimum size of first widget (from size hint)
   * @beginIdeal {Integer} Ideal size of first widget (maybe after dragging the splitter)
   * @beginMax {Integer} Maximum size of first widget (from size hint)
   * @endMin {Integer} Minimum size of second widget (from size hint)
   * @endIdeal {Integer} Ideal size of second widget (maybe after dragging the splitter)
   * @endMax {Integer} Maximum size of second widget (from size hint)
   */
  arrangeIdeals : function(beginMin, beginIdeal, beginMax, endMin, endIdeal, endMax)
  {
    if (beginIdeal < beginMin || endIdeal < endMin)
    {
      if (beginIdeal < beginMin && endIdeal < endMin)
      {
        // Just increase both, can not rearrange them otherwise
        // Result into overflowing of the overlapping content
        // Should normally not happen through auto sizing!
        beginIdeal = beginMin;
        endIdeal = endMin;
      }
      else if (beginIdeal < beginMin)
      {
        // Reduce end, increase begin to min
        endIdeal -= (beginMin - beginIdeal);
        beginIdeal = beginMin;

        // Re-check to keep min size of end
        if (endIdeal < endMin) {
          endIdeal = endMin;
        }
      }
      else if (endIdeal < endMin)
      {
        // Reduce begin, increase end to min
        beginIdeal -= (endMin - endIdeal);
        endIdeal = endMin;

        // Re-check to keep min size of begin
        if (beginIdeal < beginMin) {
          beginIdeal = beginMin;
        }
      }
    }

    if (beginIdeal > beginMax || endIdeal > endMax)
    {
      if (beginIdeal > beginMax && endIdeal > endMax)
      {
        // Just reduce both, can not rearrange them otherwise
        // Leaves a blank area in the pane!
        beginIdeal = beginMax;
        endIdeal = endMax;
      }
      else if (beginIdeal > beginMax)
      {
        // Increase end, reduce begin to max
        endIdeal += (beginIdeal - beginMax);
        beginIdeal = beginMax;

        // Re-check to keep max size of end
        if (endIdeal > endMax) {
          endIdeal = endMax;
        }
      }
      else if (endIdeal > endMax)
      {
        // Increase begin, reduce end to max
        beginIdeal += (endIdeal - endMax);
        endIdeal = endMax;

        // Re-check to keep max size of begin
        if (beginIdeal > beginMax) {
          beginIdeal = beginMax;
        }
      }
    }

    return {
      begin : beginIdeal,
      end : endIdeal
    };
  }
});