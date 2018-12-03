import { View } from 'soundworks/client';

const template = `
<p class="tiny ua"><span>userAgent: </span><%= userAgent %></p>

<div class="controls">
  <button class="btn<%= mute ? ' active' : '' %>" data-type="bool" data-target="mute">Mute</button>
  <button class="btn<%= invertPhase ? ' active' : '' %>" data-type="bool" data-target="invertPhase">Ø</button>
</div>

<p class="small">
  <span>Sync:</span>
  <% var className = syncDetails.connection === 'offline' ? 'red' : 'green' %>
  <span class="<%= className %>"><%= syncDetails.connection.toUpperCase() %></span>
</p>

<% if (state === 'syncDetails') { %>
<div class="state">
  <ul class="small">
    <li><span>status: </span><%= syncDetails.status %></li>
    <li><span>status for: </span><%= syncDetails.statusDuration.toFixed(0) %></li>
    <li><span>time offset: </span><%= syncDetails.timeOffset.toString().replace('.', '"') %></li>
    <li><span>frequency ratio: </span><%= syncDetails.frequencyRatio %></li>
    <li><span>connection: </span><%= syncDetails.connection %></li>
    <li><span>connection for: </span><%= syncDetails.connectionDuration.toFixed(0) %></li>
    <li><span>connection time out: </span><%= syncDetails.connectionTimeOut.toFixed(1).replace('.', '"') %></li>
    <li><span>travel duration: </span><%= syncDetails.travelDuration.toFixed(3).replace('.', '"') %></li>
    <li><span>travel duration min: </span><%= syncDetails.travelDurationMin.toFixed(3).replace('.', '"') %></li>
    <li><span>travel duration max: </span><%= syncDetails.travelDurationMax.toFixed(3).replace('.', '"') %></li>
  </ul>
</div>
<% } %>

<% if (state === 'calibrateDelay') { %>
<div class="state">
  <p>Calibrate Delay</p>
  <input type="number" readonly value="<%= delay %>" /><br />
  <% ['-50', '-10', '-5', '-1', '+1', '+5', '+10', '+50'].forEach(function(value) { %>
  <button class="btn" data-type="update-calibration" data-target="delay" data-value="<%= value %>"><%= value %></button>
  <% }); %>
  <button class="btn" data-type="reset-calibration" data-target="delay">Reset</button>
</div>
<% } %>

<% if (state === 'calibrateGain') { %>
<div class="state">
  <p>Calibrate Delay</p>
  <input type="number" readonly value="<%= gain %>" /><br />
  <% ['-5', '-1', '+1', '+5'].forEach(function(value) { %>
  <button class="btn" data-type="update-calibration" data-target="gain" data-value="<%= value %>"><%= value %></button>
  <% }); %>
  <button class="btn" data-type="reset-calibration" data-target="gain">Reset</button>
</div>
<% } %>


<!-- menu -->
<div class="menu">
  <button class="btn<%= state === 'syncDetails' ? ' active' : '' %>" data-type="set-state" data-target="syncDetails">
    Sync Details
  </button>
  <button class="btn<%= state === 'calibrateDelay' ? ' active' : '' %>" data-type="set-state" data-target="calibrateDelay">
    Calibrate Delay
  </button>
  <button class="btn<%= state === 'calibrateGain' ? ' active' : '' %>" data-type="set-state" data-target="calibrateGain">
    Calibrate Gain
  </button>
</div>
`;

class BeatsView extends View {
  constructor(model, experience) {
    super(template, model, {}, { id: 'beats' });

    this.experience = experience;

    this.installEvents({
      'click .btn[data-type="bool"]': e => {
        const $el = e.target;
        const target = $el.dataset.target;
        const value = !this.model[target];

        this.model[target] = value;
        this.experience.update(target, value);
        this.render();
      },
      'click .btn[data-type="set-state"]': e => {
        const $el = e.target;
        const target = $el.dataset.target;

        this.model.state = target;
        this.experience.update('state', target);
        this.render();
      },
      'click .btn[data-type="update-calibration"]': e => {
        const $el = e.target;
        const target = $el.dataset.target;
        const value = parseInt($el.dataset.value);
        this.model[target] += value;

        this.experience.update(target, this.model[target]);
        this.render();
      },
      'click .btn[data-type="reset-calibration"]': e => {
        const $el = e.target;
        const target = $el.dataset.target;
        this.model[target] = 0;

        this.experience.update(target, this.model[target]);
        this.render();
      },
    });

  }
}

export default BeatsView;
