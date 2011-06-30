### CGOL ###
# Author: Jason Giedymin
#
# Description:
# CGOL is a Coffeescript implementation of Conway's Game of Life for the browser
# and based on the [work](http://www.hanpau.com/Game3.htm) of
# [Paul Hanlon](http://www.hanpau.com). I found his implementation to
# be simple and fast but uses HTML `<table>`'s instead of `<div>`'s or a `<canvas>`.
#
# My particular implementation comes with two display rendering techniques:
#
# 1. HTML based `<div>`'s
# 2. HTML5 based canvas pixel manipulation via the `image data` array.
#
# The code has a number of toggles/features:
#
# 1. Both Height & Width size specifications.
# 2. Generation speed in ms.
# 3. Generation limit - allows the setting of the upper limit of generations.
# 4. Real-time viewing - allows viewing steps in real-time.
# 5. Manual mode - a mode that relies on the user to 'step' through.
# 6. Cycle mode - a mode which allows cycling if populations are stagnant or
# the generation limit has been reached.
# 7. Stagnation mode - allows calculating of stagnant populations
# 8. Cell size - `small`, `big`, `huge`, `massive` cell sizes. This only
# applies to the HTML `<div>` based rendering method.
#
# Requirements:
# A browser with JS capability such as Chrome.
#
### Notes ###
# This application is not particularly a cleanly coded example.
# Much was strung together from an hour here and hour there with a mobile
# device. My initial focus was to 'get something done' first and to then
# start refactoring it. Hopefully with time work can be done to clean
# the code base up because it needs it.

### Utilities ###
# This is a jQuery like utility function.
$ = (element_id) ->
      return document.getElementById(element_id)

### Classes ###
# A generic Queue class made especially more usefull as it calculates
# a trailing population (tail) flux. We can use the flux to determine
# if a population is stagnant.
class Queue
    # What was I thinking with this class???
    constructor: (@_stagnant_generation_limit=10, @_stagnant_population_flux=.01, @_silence=no) ->
        @_queue = []
    
    clear: ->
        @_queue = []
    
    getSize: ->
        console.log(@_queue.length)
    
    push: (value) ->
        @_queue.push(value)
    
    getLast: () ->
        return @_queue[@_queue.length-1]
    
    getData: ->
        return @_queue
    
    # This function gets the trailing snapshot (tail).
    getSnapshot: (snapshot_size = @_stagnant_generation_limit) ->
        return [1,100] if @_queue.length <= 2

        _queue_size = @_queue.length - 1
        
        if (_queue_size >= snapshot_size)
            return @_queue.slice(_queue_size - snapshot_size, _queue_size) 
        else
            return @_queue

    getFlux: () ->
        compareNumbers = (a, b) ->
            return a - b;
        
        _population_data = @getSnapshot()

        _population_data.sort(compareNumbers)
        _max_index = _population_data.length-1
        _min_population = _population_data[0]
        _max_population = _population_data[_max_index]

        if _min_population is 0 or _max_population is 0
            return 0

        _curr_flux = 1-(_min_population/_max_population)
        _curr_flux.toFixed(3)
            
    isPopulationStagnant: (_max_flux = @_stagnant_population_flux) ->
        _curr_flux = @getFlux()

        #console.log("#{_min_population}, #{_max_population} = #{1-(_min_population/_max_population)}")
        #console.log(_population_data)
        
        if _curr_flux <= _max_flux and !@_silence
            console.log("Stagnant flux: #{_curr_flux}.")
            return true
        else false

# Basic CGOL class.
class CgolBasic
    constructor: (@_rows = 50, @_cols = 100, @_interval_limit = 5000, @_cycle=yes) ->
        #[@_rows, @_cols] = [50, 100]

        ### Toggles ###
        @_manual = no
        @_realtime_view = yes
        @_calculate_stagnation = yes
        @_speed = 1 # SetInterval @_speed in ms
        @_cell_size = "huge"

        ### Vars - don't touch ###
        @_world_table = []
        @_world_table_last = []
        @_worlds_with_life = []

        @_is_running = no
        @_worlds_tested = 0
        @_interval = 0 # Current steps
        @_timer = null # Stored @_interval
        @_stagnant_generation_limit = 10 # num of generations we consider no population change to be stagnant
        @_stagnant_population_flux = .011 # 5% or less is considered stagnant
        @_populations = new Queue(@_stagnant_generation_limit, @_stagnant_population_flux, @_manual)

        @_context = canvas.getContext '2d' if canvas?
        @_image = @_context.createImageData @_cols, @_rows
        @_pixels = @_image.data

    # Sets up the world of nodes first by writing HTML code.
    setupWorld: () ->
        string_buffer = []

        for y in [0...@_rows]
            @_world_table[y] = []
            string_buffer.push('<tr>')

            for x in [0...@_cols]
                string_buffer.push('<div id="c'+y+'_'+x+'" class="cell off #{@_cell_size}"></div>')
                @_world_table[y][x] = 0;
            
            string_buffer.push('</div>')

        $("simulation").innerHTML = string_buffer.join("")
  
    # The basic rules of life here. Oh this needs refactoring...
    calculate_world: () ->
        start_date = new Date()
        c = 0
        _current_population = 0

        z = []
        t = @_rows-1

        for y in [0...@_rows]
            z[y] = []
            b = if (y == (@_rows-1)) then 0 else y+1
            l = @_cols-1

            for x in [0...@_cols]
                cell = $("c"+y+'_'+x)
                r = if (x == @_cols-1) then 0 else x+1

                c = @_world_table[t][l] + @_world_table[t][x] + @_world_table[t][r]  + @_world_table[y][l] + @_world_table[y][r] + @_world_table[b][l] + @_world_table[b][x] + @_world_table[b][r]

                switch c
                    when 3
                        z[y][x] = 1
                        @drawNode(y, x, "on") if @_realtime_view
                        _current_population++
                    when 2
                        z[y][x] = @_world_table[y][x]
                    else
                        @drawNode(y, x, "off") if @_realtime_view
                        z[y][x] = 0

                l = x
            t = y

        @_populations.push(_current_population)

        @_world_table = z

        @_interval++

        if @_interval >= @_interval_limit # passed the @_interval limit
            if not @_cycle
                clearInterval(@_timer)
            else
                @_worlds_tested++
                @_interval = 0
                @_populations.clear()
                @clearWorld()
                @doPattern()
                @drawCurrentWorld()
            
            @printStatus(start_date)

        else # keep on going
            if not @_realtime_view
                if (@_interval / 100) % 2 is 0 or (@_interval / 100) % 2 is 1
                    @printStatus(start_date)
                    @drawCurrentWorld()
            else
                @printStatus(start_date)
            
            if @_populations.isPopulationStagnant(@_stagnant_population_flux) and @_calculate_stagnation
                if !@_manual and @_cycle
                    @_worlds_tested++
                    @clearWorld()
                    @_interval = 0
                    @_populations.clear()
                    @doPattern()
                    @drawCurrentWorld()

    # Prints the current status and step of the world.
    printStatus: (start_date) ->
        $("time").innerHTML = "[#{Math.round(1000/(new Date()-start_date))}]fps, Step:[#{@_interval}], Pop:[#{@_populations.getLast()}], World:[#{@_worlds_tested}], Flux:[#{@_populations.getFlux()}]."

    # Create some patterns so we can work with them and see what happens.
    doPattern: (pattern="rand") ->
        switch pattern
            when "rand"
                for y in [0...@_rows]
                    for x in [0...@_cols]
                        if Math.random() > Math.random()
                            @_world_table[y][x] = 1

            when "oscillator"
                # Oscillator (should move)
                @_world_table[2][1] = 1
                @_world_table[2][2] = 1
                @_world_table[2][3] = 1

            when "beehive"
                # Beehive (should be static)
                @_world_table[2][2] = 1
                @_world_table[2][3] = 1
                @_world_table[3][1] = 1
                @_world_table[3][4] = 1
                @_world_table[4][2] = 1
                @_world_table[4][3] = 1

            when "toad"
                # Toad
                @_world_table[2][2] = 1
                @_world_table[2][3] = 1
                @_world_table[2][4] = 1
                @_world_table[3][1] = 1
                @_world_table[3][2] = 1
                @_world_table[3][3] = 1
            
            when "data"
                [start_x, start_y] = [25, 25]

                @_world_table[start_y + 2][start_x + 2] = 1
                @_world_table[start_y + 2][start_x + 3] = 1
                @_world_table[start_y + 2][start_x + 4] = 1
                @_world_table[start_y + 3][start_x + 1] = 1
                @_world_table[start_y + 3][start_x + 2] = 1
                @_world_table[start_y + 3][start_x + 3] = 1

        @_world_table_last = @_world_table

    # Wipe out and reset the world.
    clearWorld: () ->
        for y in [0...@_rows]
            for x in [0...@_cols]
                cell = $("c"+y+'_'+x)
                @_world_table[y][x] = 0

    # Draw the current state of the world.
    drawCurrentWorld: () ->
        _current_population = 0

        for y in [0...@_rows]
            for x in [0...@_cols]
                cell = $("c"+y+'_'+x)
                if @_world_table[y][x] is 1
                    @drawNode(y, x, "on")
                    _current_population++
                else
                     @drawNode(y, x, "off")
        
        @_populations.push(_current_population)

    # Draw a particular node with a set size.
    drawNode: (y=0, x=0, state="off", size=@_cell_size, node_css_class="cell", node_css_first="first", view_type="html") ->
        switch view_type
            when "html"
                # Uses HTML `<div>` objects and css class selectors to animate
                # 'off' and 'on' states. Fast! Much faster than my previous
                # `<table>` setup.
                cell = $("c"+y+'_'+x)

                if x == 0
                    cell.className = "#{node_css_class} #{state} #{size} #{node_css_first}"
                else
                    cell.className = "#{node_css_class} #{state} #{size}"
            when "canvas"
                # Uses HTML5's canvas object to write directly to an image obj.
                # It is SLOW as crap in this implementation. Turn real-time
                # view to off and it will be faster but NO way as fast as
                # raw div access in 'html' mode.

                pixel_index = (y * @_cols + x) * 4

                if state == "on"
                    @_pixels[pixel_index  ] = 0 #red channel
                    @_pixels[pixel_index+1] = 0 #green channel
                    @_pixels[pixel_index+2] = 0 #blue channel
                    @_pixels[pixel_index+3] = 255 # alpha
                else
                    @_pixels[pixel_index  ] = 255 #red channel
                    @_pixels[pixel_index+1] = 255 #green channel
                    @_pixels[pixel_index+2] = 255 #blue channel
                    @_pixels[pixel_index+3] = 255 # alpha

                # Write the image data out to the canvas context.
                @_context.putImageData @_image, 0, 0

    # Easy toggle to flip state.
    toggle: () ->
        if @_is_running
            $("toggle").innerHTML = "Start"
            clearInterval(@_timer)
            @_is_running = !@_is_running

        else
            $("toggle").innerHTML = "Stop"
            @_timer = setInterval( (=> @calculate_world() ), @_speed)
            @_is_running = !@_is_running
    
    # Reset all states.
    reset: () ->
        @_is_running = no
        @_worlds_tested++
        @clearWorld()
        @_interval = 0
        @_populations.clear()
        @drawCurrentWorld()

    # For when clicking on the random button.
    randomSetup: () ->
        @_is_running = no
        @_worlds_tested++
        @clearWorld()
        @_interval = 0
        @_populations.clear()
        @doPattern() if ! @_manual
        @drawCurrentWorld()

    # Predefined pattern for testing.
    dataSetup: () ->
        @doPattern("data")
        @drawCurrentWorld()

    # Toggle a particular cell, used when manually clicking.
    toggleCell: (y, x) ->
        @_world_table[y][x] = if @_world_table[y][x] is 0 then 1 else 0

        if @_world_table[y][x] is 1
            @drawNode(y, x, "on")
        else
            @drawNode(y, x, "off")
    
    # Start the generation when app is loaded and ready.
    autoStart: () ->
        @setupWorld()

        if !@_manual
            @doPattern()
            @toggle()

        @drawCurrentWorld()
    
    # Step the generation by 1.
    stepApp: () ->
        if !@_realtime_view
            console.log("Realtime view was not requested but stepping requires it. App is overriding the setting to yes.")
            @_realtime_view = yes

        @calculate_world() # if !@_timer?

# The magic starts here
init = ->
    cgolApp = new CgolBasic()
    cgolApp.autoStart()
    
    window.cgolApp = cgolApp

    $("simulation").onclick = () ->
        clicked_html = if e? then e.target else window.event.srcElement
        if clicked_html.nodeName is "DIV"
            [y,x] = clicked_html.id.substr(1).split("_")
            cgolApp.toggleCell(y,x)

# On browser load do the following.
window.onload = () -> 
    init()

### Buttons ###
# Here are some browser based helper exports for button interactions.

window.toggleApp = ->
    cgolApp.toggle()

window.stepApp = ->
    cgolApp.stepApp()

window.randomSetup = ->
    cgolApp.randomSetup()

window.dataSetup = ->
    cgolApp.dataSetup()

window.resetApp = ->
    cgolApp.reset()

