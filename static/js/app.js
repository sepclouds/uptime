(function () {
  'use strict';

  var config = window.Config || {};
  var statusText = {
    ok: '在线',
    down: '故障',
    unknow: '未知',
  };

  function append(parent, child) {
    parent.appendChild(child);
    return child;
  }

  function el(tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }

  function link(to, text, className) {
    var node = el('a', className, className === 'link' ? '' : text);
    node.href = to || '#';
    node.target = '_blank';
    node.rel = 'noopener noreferrer';
    if (className === 'link') {
      node.title = text || '';
      node.setAttribute('aria-label', text || '');
    }
    return node;
  }

  function formatNumber(value) {
    var number = Number(value);
    if (!Number.isFinite(number)) number = 0;
    return String(Math.floor(number * 100) / 100);
  }

  function formatDuration(seconds) {
    var s = parseInt(seconds, 10) || 0;
    var m = 0;
    var h = 0;
    if (s >= 60) {
      m = parseInt(s / 60, 10);
      s = parseInt(s % 60, 10);
      if (m >= 60) {
        h = parseInt(m / 60, 10);
        m = parseInt(m % 60, 10);
      }
    }
    var text = s + ' 秒';
    if (m > 0) text = m + ' 分 ' + text;
    if (h > 0) text = h + ' 小时 ' + text;
    return text;
  }

  function addDays(date, days) {
    var next = new Date(date.getTime());
    next.setDate(next.getDate() + days);
    return next;
  }

  function unix(date) {
    return Math.floor(date.getTime() / 1000);
  }

  function pad(value) {
    return String(value).padStart(2, '0');
  }

  function formatDate(date) {
    return date.getFullYear() + '-' + pad(date.getMonth() + 1) + '-' + pad(date.getDate());
  }

  function dateKey(date) {
    return '' + date.getFullYear() + pad(date.getMonth() + 1) + pad(date.getDate());
  }

  function dayStart(date) {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
  }

  function overlapSeconds(startA, endA, startB, endB) {
    var start = Math.max(startA, startB);
    var end = Math.min(endA, endB);
    return Math.max(0, Math.floor((end - start) / 1000));
  }

  function sortLogs(logs) {
    return (Array.isArray(logs) ? logs.slice() : []).sort(function (a, b) {
      return (a.datetime || 0) - (b.datetime || 0);
    });
  }

  function apiKeys() {
    if (Array.isArray(config.ApiKeys)) return config.ApiKeys.filter(Boolean);
    if (typeof config.ApiKeys === 'string' && config.ApiKeys) return [config.ApiKeys];
    return [];
  }

  function buildHeader(root) {
    var header = append(root, el('div', null));
    header.id = 'header';
    var container = append(header, el('div', 'container'));
    append(container, el('h1', 'logo', config.SiteName || 'UpTime'));
    var navi = append(container, el('div', 'navi'));
    (Array.isArray(config.Navi) ? config.Navi : []).forEach(function (item) {
      append(navi, link(item.url, item.text));
    });
  }

  function buildShell(root) {
    buildHeader(root);
    var container = append(root, el('div', 'container'));
    var uptime = append(container, el('div'));
    uptime.id = 'uptime';

    append(container, el('div')).id = 'footer';
    var footer = container.querySelector('#footer');
    var first = append(footer, el('p'));
    first.append('基于 ');
    append(first, link('https://uptimerobot.com/', 'UptimeRobot'));
    first.append(' 接口制作，检测频率 5 分钟');
    var second = append(footer, el('p'));
    second.append('By ');
    append(second, link('https://zrf.me/', 'ZRF.ME'));
    second.append(' · CDN ');
    append(second, link('https://www.cloudflare.com/', 'Cloudflare'));
    second.append(' · 致谢 ');
    append(second, link('https://github.com/yb', 'yb'));

    return uptime;
  }

  function loadingSite() {
    var site = el('div', 'site site-loading');
    var meta = append(site, el('div', 'meta'));
    var title = append(meta, el('span', 'title'));
    append(title, el('span', 'name'));
    append(title, el('span', 'link'));
    append(meta, el('span', 'status'));

    var timeline = append(site, el('div', 'timeline'));
    var days = Math.max(1, parseInt(config.CountDays, 10) || 60);
    for (var index = 0; index < days; index += 1) {
      append(timeline, el('i', 'none'));
    }

    var summary = append(site, el('div', 'summary'));
    append(summary, el('span'));
    append(summary, el('span'));
    append(summary, el('span'));
    return site;
  }

  function loadingOverview() {
    var overview = el('div', 'overview overview-loading');
    ['监控项', '在线', '故障', '平均可用率'].forEach(function (label) {
      var item = append(overview, el('div', 'overview-item'));
      append(item, el('span', 'overview-label', label));
      append(item, el('strong', 'overview-value'));
    });
    return overview;
  }

  function messageSite(title, message) {
    var site = el('div', 'site');
    var meta = append(site, el('div', 'meta'));
    append(meta, el('span', 'name', title));
    append(meta, el('span', 'status unknow', statusText.unknow));
    var summary = append(site, el('div', 'summary'));
    append(summary, el('span', null, message));
    return site;
  }

  function renderOverview(monitors) {
    var total = monitors.length;
    var online = monitors.filter(function (site) {
      return site.status === 'ok';
    }).length;
    var down = monitors.filter(function (site) {
      return site.status === 'down';
    }).length;
    var average = total
      ? formatNumber(monitors.reduce(function (sum, site) {
        return sum + Number(site.average || 0);
      }, 0) / total)
      : '0';

    var overview = el('div', 'overview');
    appendOverviewItem(overview, '监控项', String(total), '');
    appendOverviewItem(overview, '在线', String(online), 'ok');
    appendOverviewItem(overview, '故障', String(down), down ? 'down' : '');
    appendOverviewItem(overview, '平均可用率', average + '%', 'uptime');
    return overview;
  }

  function appendOverviewItem(parent, label, value, tone) {
    var item = append(parent, el('div', 'overview-item' + (tone ? ' ' + tone : '')));
    append(item, el('span', 'overview-label', label));
    append(item, el('strong', 'overview-value', value));
  }

  function buildDateWindow(days) {
    var count = Math.max(1, parseInt(days, 10) || 60);
    var today = new Date();
    today.setHours(0, 0, 0, 0);

    var dates = [];
    for (var index = 0; index < count; index += 1) {
      dates.push(addDays(today, -index));
    }

    var start = unix(dates[dates.length - 1]);
    var end = unix(addDays(dates[0], 1));
    var nowMs = Date.now();

    return {
      count: count,
      dates: dates,
      start: start,
      end: end,
      startMs: start * 1000,
      endMs: end * 1000,
      nowMs: nowMs,
      windowEndMs: Math.min(end * 1000, nowMs),
    };
  }

  function buildDailyStats(timeWindow, monitorStartMs, outages) {
    var map = {};
    var daily = timeWindow.dates.map(function (date, index) {
      var startMs = dayStart(date);
      var endMs = dayStart(addDays(date, 1));
      var effectiveEndMs = Math.min(endMs, timeWindow.nowMs);
      var monitoredSeconds = overlapSeconds(startMs, effectiveEndMs, Math.max(startMs, monitorStartMs || 0), effectiveEndMs);

      map[dateKey(date)] = index;
      return {
        date: date,
        startMs: startMs,
        endMs: endMs,
        monitoredSeconds: monitoredSeconds,
        uptime: monitoredSeconds > 0 ? 100 : 0,
        down: { times: 0, duration: 0 },
      };
    });

    var total = { times: 0, duration: 0 };

    function applyOutage(outageStartMs, outageEndMs, countIncident) {
      outageEndMs = Math.min(outageEndMs, timeWindow.windowEndMs);
      if (outageEndMs <= timeWindow.startMs || outageStartMs >= timeWindow.windowEndMs) return;

      var outageDurationInRange = 0;
      var startedDay = map[dateKey(new Date(Math.max(outageStartMs, timeWindow.startMs)))];

      daily.forEach(function (day) {
        var overlap = overlapSeconds(outageStartMs, outageEndMs, day.startMs, day.endMs);
        if (!overlap) return;
        day.down.duration += overlap;
        outageDurationInRange += overlap;
      });

      total.duration += outageDurationInRange;
      if (countIncident) total.times += 1;
      if (startedDay !== undefined) daily[startedDay].down.times += 1;
    }

    (outages || []).forEach(function (outage) {
      if (!outage || !Number.isFinite(outage.startMs) || !Number.isFinite(outage.endMs)) return;
      applyOutage(outage.startMs, outage.endMs, outage.countIncident !== false);
    });

    var monitoredTotal = 0;
    daily.forEach(function (day) {
      monitoredTotal += day.monitoredSeconds;
      if (day.monitoredSeconds > 0) {
        day.uptime = Math.max(0, 100 - day.down.duration / day.monitoredSeconds * 100);
      }
    });

    return {
      daily: daily,
      total: total,
      average: monitoredTotal > 0 ? formatNumber(100 - total.duration / monitoredTotal * 100) : '0',
    };
  }

  async function readJson(response) {
    try {
      return await response.json();
    } catch (error) {
      return null;
    }
  }

  function addOutage(outages, outage, seen) {
    if (!outage || outage.endMs <= outage.startMs) return;
    var id = outage.id ? String(outage.id) : '';
    if (id && seen[id]) return;
    if (id) seen[id] = true;
    outages.push(outage);
  }

  async function getMonitorsV2(apikey, timeWindow, signal) {
    var body = new URLSearchParams({
      api_key: apikey,
      format: 'json',
      logs: '1',
      log_types: '1-2',
      logs_start_date: String(timeWindow.start),
      logs_end_date: String(timeWindow.end),
    });

    var response = await fetch('https://api.uptimerobot.com/v2/getMonitors', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body,
      signal: signal,
    });
    if (!response.ok) throw new Error('HTTP ' + response.status);

    var data = await readJson(response);
    if (!data || data.stat !== 'ok') {
      var apiError = data && data.error && (data.error.message || data.error.type);
      throw new Error(apiError || 'UptimeRobot API 返回失败');
    }

    return (data.monitors || []).map(function (monitor) {
      var outages = [];
      var seen = {};
      var logs = sortLogs(monitor.logs);
      var activeOutage = monitor.lastLogTypeBeforeStartDate && monitor.lastLogTypeBeforeStartDate.type === 1
        ? monitor.lastLogTypeBeforeStartDate
        : null;

      function addV2Outage(id, outageStartMs, outageEndMs) {
        addOutage(outages, {
          id: id,
          startMs: outageStartMs,
          endMs: Math.min(outageEndMs, timeWindow.windowEndMs),
          countIncident: true,
        }, seen);
      }

      if (activeOutage) {
        var firstUpLog = logs.find(function (log) {
          return log.type === 2 && log.datetime * 1000 >= timeWindow.startMs;
        });
        var activeStartMs = activeOutage.datetime * 1000;
        var activeDuration = activeOutage.duration || 0;
        if (activeDuration > 0 || firstUpLog || monitor.status === 9) {
          var activeEndMs = activeDuration > 0
            ? activeStartMs + activeDuration * 1000
            : (firstUpLog ? firstUpLog.datetime * 1000 : timeWindow.windowEndMs);
          addV2Outage('before:' + activeOutage.datetime, activeStartMs, activeEndMs);
        }
      }

      logs.forEach(function (log) {
        if (log.type !== 1) return;
        var outageStartMs = log.datetime * 1000;
        var duration = log.duration || (monitor.status === 9 ? Math.max(0, timeWindow.windowEndMs / 1000 - log.datetime) : 0);
        if (!duration) {
          var nextUpLog = logs.find(function (candidate) {
            return candidate.type === 2 && candidate.datetime > log.datetime;
          });
          duration = nextUpLog ? nextUpLog.datetime - log.datetime : 0;
        }
        addV2Outage('log:' + log.datetime, outageStartMs, outageStartMs + duration * 1000);
      });

      var stats = buildDailyStats(timeWindow, (monitor.create_datetime || 0) * 1000, outages);
      var status = 'unknow';
      if (monitor.status === 2) status = 'ok';
      if (monitor.status === 9) status = 'down';

      return {
        id: monitor.id,
        name: monitor.friendly_name || monitor.url || 'Unnamed monitor',
        url: monitor.url,
        average: stats.average,
        daily: stats.daily,
        total: stats.total,
        status: status,
      };
    });
  }

  async function getMonitors(apikey, days) {
    var timeWindow = buildDateWindow(days);
    var controller = new AbortController();
    var timer = setTimeout(function () {
      controller.abort();
    }, 60000);

    try {
      return await getMonitorsV2(apikey, timeWindow, controller.signal);
    } finally {
      clearTimeout(timer);
    }
  }

  function renderSite(site) {
    var node = el('div', 'site status-' + site.status);
    var meta = append(node, el('div', 'meta'));
    var title = append(meta, el('div', 'title'));
    var name = append(title, el('span', 'name'));
    name.innerHTML = site.name;
    if (config.ShowLink !== false && site.url) {
      append(title, link(site.url, site.name, 'link'));
    }
    append(meta, el('span', 'status ' + site.status, statusText[site.status]));

    var timeline = append(node, el('div', 'timeline'));
    site.daily.slice().sort(function (a, b) {
      return a.date - b.date;
    }).forEach(function (data) {
      var state = '';
      var text = formatDate(data.date) + ' ';
      if (data.monitoredSeconds <= 0) {
        state = 'none';
        text += '无数据';
      } else if (data.uptime >= 100) {
        state = 'ok';
        text += '可用率 ' + formatNumber(data.uptime) + '%';
      } else {
        state = 'down';
        text += '故障 ' + data.down.times + ' 次，累计 ' + formatDuration(data.down.duration) + '，可用率 ' + formatNumber(data.uptime) + '%';
      }
      var tick = append(timeline, el('i', state));
      tick.title = text;
      tick.setAttribute('aria-label', text);
    });

    var summary = append(node, el('div', 'summary'));
    append(summary, el('span', null, formatDate(site.daily[site.daily.length - 1].date)));
    append(summary, el(
      'span',
      null,
      site.total.times
        ? '最近 ' + (config.CountDays || 60) + ' 天故障 ' + site.total.times + ' 次，累计 ' + formatDuration(site.total.duration) + '，平均可用率 ' + site.average + '%'
        : '最近 ' + (config.CountDays || 60) + ' 天可用率 ' + site.average + '%'
    ));
    append(summary, el('span', null, '今天'));

    return node;
  }

  function renderMonitors(uptime, overviewPlaceholder, placeholder, key) {
    getMonitors(key, config.CountDays).then(function (monitors) {
      var nodes = monitors.length ? monitors.map(renderSite) : [messageSite('暂无监控项', 'UptimeRobot 没有返回监控数据')];
      if (monitors.length) {
        overviewPlaceholder.replaceWith(renderOverview(monitors));
      } else {
        overviewPlaceholder.remove();
      }
      placeholder.replaceWith.apply(placeholder, nodes);
    }).catch(function (error) {
      var message = error.name === 'AbortError' ? 'UptimeRobot 接口超过 60 秒没有响应' : (error.message || '请检查 ApiKeys 或网络连接');
      if (/429|Too Many Requests/i.test(message)) message = 'UptimeRobot 请求过于频繁，请稍后再刷新';
      overviewPlaceholder.remove();
      placeholder.replaceWith(messageSite('加载失败', message));
    });
  }

  function start() {
    var root = document.getElementById('app');
    if (!root) return;
    document.title = config.SiteName || 'UpTime';
    root.textContent = '';
    var uptime = buildShell(root);
    var keys = apiKeys();
    if (!keys.length) {
      append(uptime, messageSite('缺少 API Key', '请在 config.js 中配置 ApiKeys'));
      return;
    }
    keys.forEach(function (key) {
      var overviewPlaceholder = append(uptime, loadingOverview());
      var placeholder = append(uptime, loadingSite());
      renderMonitors(uptime, overviewPlaceholder, placeholder, key);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }
}());
