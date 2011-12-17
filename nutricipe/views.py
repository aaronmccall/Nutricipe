from nutricipe.lib.base import render_html

__author__ = 'Aaron'

def home(request):

    return render_html(request, 'base.html', {})