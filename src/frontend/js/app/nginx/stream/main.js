'use strict';

const Mn          = require('backbone.marionette');
const StreamModel = require('../../../models/stream');
const Api         = require('../../api');
const Cache       = require('../../cache');
const Controller  = require('../../controller');
const ListView    = require('./list/main');
const ErrorView   = require('../../error/main');
const template    = require('./main.ejs');
const EmptyView   = require('../../empty/main');

module.exports = Mn.View.extend({
    id:       'nginx-streams',
    template: template,

    ui: {
        list_region: '.list-region',
        add:         '.add-item',
        dimmer:      '.dimmer'
    },

    regions: {
        list_region: '@ui.list_region'
    },

    events: {
        'click @ui.add': function (e) {
            e.preventDefault();
            Controller.showNginxStreamForm();
        }
    },

    templateContext: {
        showAddButton: Cache.User.canManage('streams')
    },

    onRender: function () {
        let view = this;

        Api.Nginx.RedirectionHosts.getAll()
            .then(response => {
                if (!view.isDestroyed()) {
                    if (response && response.length) {
                        view.showChildView('list_region', new ListView({
                            collection: new StreamModel.Collection(response)
                        }));
                    } else {
                        let manage = Cache.User.canManage('streams');

                        view.showChildView('list_region', new EmptyView({
                            title:     'There are no Streams',
                            subtitle:  manage ? 'Why don\'t you create one?' : 'And you don\'t have permission to create one.',
                            link:      manage ? 'Add Stream' : null,
                            btn_color: 'blue',
                            action:    function () {
                                Controller.showNginxStreamForm();
                            }
                        }));
                    }
                }
            })
            .catch(err => {
                view.showChildView('list_region', new ErrorView({
                    code:    err.code,
                    message: err.message,
                    retry:   function () {
                        Controller.showNginxStream();
                    }
                }));

                console.error(err);
            })
            .then(() => {
                view.ui.dimmer.removeClass('active');
            });
    }
});