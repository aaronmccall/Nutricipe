from django.db.models.query_utils import Q
from nutricipe.lib.base import render_html, render_json
from nutricipe.lib.models import convert_model_to_json
from nutricipe.main.models import FoodDescription

__author__ = 'Aaron'

def home(request):

    return render_html(request, 'base.html', {})

def ingred_search(request):
    query = request.GET.get('q')

    if query:
        results = FoodDescription.objects.filter(Q(long_desc__icontains=query)|Q())
        payload = [convert_model_to_json(model) for model in results]
    else:
        payload = {'success': False}

    return render_json(payload)