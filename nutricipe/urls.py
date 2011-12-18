from django.conf.urls.defaults import patterns, include, url

# Uncomment the next two lines to enable the admin:
# from django.contrib import admin
# admin.autodiscover()

urlpatterns = patterns('nutricipe.views',
    # Examples:
    # url(r'^$', 'nutricipe.views.home', name='home'),
    # url(r'^nutricipe/', include('nutricipe.foo.urls')),

    # Uncomment the admin/doc line below to enable admin documentation:
    # url(r'^admin/doc/', include('django.contrib.admindocs.urls')),

    # Uncomment the next line to enable the admin:
    # url(r'^admin/', include(admin.site.urls)),
    url(r'^ingredient/search/$', 'ingred_search', name='ingredient_search'),
    url(r'^$', 'home', name='home'),
)
