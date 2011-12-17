import json
import mimetypes
from django.core.serializers.json import DjangoJSONEncoder
from django.core.serializers import serialize
from django.db import models
from django.db.models.query import QuerySet
from django.http import HttpResponse
from django.shortcuts import redirect
from django.template.context import RequestContext
from django.template import Context
from django.template.loader import get_template
from nutricipe import settings

class BaseError(Exception):
    """Base error class"""
    msg = message_template = None

    def __init__(self, msg=None):
        if msg is not None:
            self.msg = msg
        elif self.message_template is not None:
            self.msg = self.message_template

    def __unicode__(self, *args, **kwargs):
        return unicode(self.msg if self.msg is not None else self.message_template)


    def __str__(self):
        return unicode(self).encode('utf-8')


BASE2 = "01"
BASE10 = "0123456789"
BASE16 = "0123456789ABCDEF"
BASE36 = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ"
BASE62 = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyz"

def baseconvert(number,fromdigits,todigits):
    """ converts a "number" between two bases of arbitrary digits

    The input number is assumed to be a string of digits from the
    fromdigits string (which is in order of smallest to largest
    digit). The return value is a string of elements from todigits
    (ordered in the same way). The input and output bases are
    determined from the lengths of the digit strings. Negative
    signs are passed through.

    decimal to binary
    >>> baseconvert(555,BASE10,BASE2)
    '1000101011'

    binary to decimal
    >>> baseconvert('1000101011',BASE2,BASE10)
    '555'

    integer interpreted as binary and converted to decimal (!)
    >>> baseconvert(1000101011,BASE2,BASE10)
    '555'

    base10 to base4
    >>> baseconvert(99,BASE10,"0123")
    '1203'

    base4 to base5 (with alphabetic digits)
    >>> baseconvert(1203,"0123","abcde")
    'dee'
    """
    base_length = len(todigits)

    if str(number)[0]=='-':
        number = str(number)[1:]
        neg=1
    else:
        neg=0

    # make an integer out of the number
    x=0
    for digit in str(number):
       x = x*len(fromdigits) + fromdigits.index(digit)

    # create the result in base 'len(todigits)'
    if x is 0:
        res = todigits[0]
    else:
        res=""
        while x>0:
            digit = x % base_length
            res = todigits[digit] + res
            x = int(x / base_length)
        if neg:
            res = "-"+res

    return res

def jsonify(object):
    from kernel.lib.models import convert_model_to_json, extract_fields_from_model
    object = convert_model_to_json(object) if isinstance(object, models.Model) else object
    if isinstance(object, QuerySet):
        return serialize('json', object)
    return json.dumps(object, cls=DjangoJSONEncoder)

def dynamiQ(fields, types, values, operator='or'):
    """
     Takes arguments & constructs Qs for filter()
     We make sure we don't construct empty filters that would
        return too many results
     We return an empty dict if we have no filters so we can
        still return an empty response from the view
    """
    from django.db.models import Q

    queries = []
    q = None
    for (f, t, v) in zip(fields, types, values):
        # We only want to build a Q with a value
        if v != "":
            kwargs = {str('%s__%s' % (f,t)) : str('%s' % v)}
            queries.append(Q(**kwargs))

    # Make sure we have a list of filters
    if len(queries) > 0:
        q = Q()
        # AND/OR awareness
        for query in queries:
            if operator == "and":
                q = q & query
            elif operator == "or":
                q = q | query
            else:
                q = None

    return q

def redirect_with_get_args(to, *args, **kwargs):
    get_string = None
    if kwargs.get('get_args'):
        get_args = kwargs.pop('get_args')
        get_string = "?%s" % "&".join(["%s=%s" % (k,v) for k,v in get_args.items()])
#        print get_string

    response = redirect(to, *args, **kwargs)
    response['Location'] += get_string or ''
    return response

def render_csv(csv_data, filename=None, attachment=True):
    return render_file(csv_data, filename, attachment, **{'mimetype': 'text/csv'})

def render_pdf(pdf_file, filename=None, attachment=True):
    return render_file(pdf_file, filename, attachment, **{'mimetype': 'application/pdf'})

def render_file(handle_or_string, filename=None, attachment=True, **kwargs):
    """
    Given a python file object handle or string {handle_or_string} and an optional download filename {filename},
    returns the file as an django HttpResponse with the file as an attachment (or inline)
    with the given mimetype (or text/plain)
    """
    mimetype = kwargs.get('mimetype', 'text/plain')
    file_extension = mimetypes.guess_extension(mimetype)
    try:
        filename = filename or handle_or_string.name().split('/').pop()
    except Exception:
        filename = 'download%s' % file_extension or '.txt'

    response = HttpResponse(
        handle_or_string.read() if isinstance(handle_or_string, file) else handle_or_string,
        mimetype=mimetype,
    )
    response['Content-Disposition'] = '%s; filename=%s' % (
        'attachment',
        filename
    ) if attachment else 'inline'

    return response

def render_json(object):
    """
    Takes a serializable object (list, tuple, dict, etc.) and returns a JSON document
    as a django HttpResponse with the 'application/json' mimetype.
    """
    return HttpResponse(jsonify(object), content_type='application/json')

def render_html(request, template, data_dict):
    """Wraps render to response, automatically setting up context_instance."""
    from django.shortcuts import render_to_response

    data_dict['settings'] = settings

    if data_dict.get('form', False) and 'action' not in data_dict:
        data_dict['action'] = data_dict.get('action', request.get_full_path())

    return render_to_response(template, data_dict, context_instance=RequestContext(request))

def intersect(a, b):
    """ return the intersection of two lists """
    return list(set(a) & set(b))

def union(a, b):
    """ return the union of two lists """
    return list(set(a) | set(b))

def difference(a, b):
    """ show whats in list b which isn't in list a """
    return list(set(b).difference(set(a)))

def dict_flip(dict_to_flip):
    """
    Given a dictionary { 'foo': 1, 'bar': 2 } returns { 1: 'foo', 2: 'bar' }
    :param dict_to_flip: dict
    :return: dict
    """
    return dict((v,k) for k,v in dict_to_flip.items())

def dict_intersect_keys(dict_to_filter, keys, keys_are_model_fields=False):
    dict_to_return = {}
    for key in keys:
        if key in dict_to_filter:
            dict_to_return[key] = dict_to_filter[key]
        if keys_are_model_fields and key+'_id' in dict_to_filter:
            dict_to_return[key+'_id'] = dict_to_filter[key+'_id']
            if key in dict_to_filter and dict_to_return[key] is None:
                del dict_to_return[key]

    return dict_to_return