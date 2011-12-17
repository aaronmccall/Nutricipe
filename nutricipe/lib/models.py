from exceptions import TypeError, ValueError
from operator import attrgetter
from django.conf import settings
from django.core.exceptions import ObjectDoesNotExist
from django.core.paginator import Paginator, EmptyPage, InvalidPage
from django.core.serializers.json import DjangoJSONEncoder
from django.db import models
from django.db.models import Manager
import django.db.models
from django.db.models.base import Model
from django.db.models.fields.related import ReverseSingleRelatedObjectDescriptor
from django.db.models.query import QuerySet
from django.db.models.signals import post_init
from nutricipe.lib.base import difference

__author__ = 'Aaron'


def convert_model_to_json(model, config_method='__toJSON__'):
    """

    :param model:
    :return:
    """
#    print "convert_model_to_json called on %s" % model
    config = {'self': {'fields': '__all__'}}
    output = {}
    if hasattr(model, config_method):
        config.update(getattr(model, config_method)())
#        pprint(config)
    for key in config:
        if key == 'self':
            model_fields = extract_fields_from_model(model, **config[key])
#            pprint(model_fields)
            if model_fields is not None:
                output.update(model_fields)
        elif key == 'related':
            for rel in config[key]:
#                print 'Related field is "%s"' % rel
                rel_config = config[key][rel]
                rel_has_own_config = 'use_own_config' in rel_config and rel_config['use_own_config']
#                if rel_has_own_config: print "%s has its own config" % rel
                get_rel = attrgetter(rel)
                try:
                    rel_model = get_rel(model)
                except (ObjectDoesNotExist, AttributeError):
                    rel_model = None

#                print "rel_model is %s" % rel_model
                
                has_dot = rel.find('.') >= 0

                #
                if not has_dot or rel_config.get('flat'):
                    rel_name = rel_config.get('name', rel)
                else:
                    segs = rel.split('.')
                    rel_name = segs.pop()

                if not rel_has_own_config:
                    rel_model_fields = extract_fields_from_model(rel_model, **rel_config) \
                        if not isinstance(rel_model, (Manager, QuerySet)) else list(rel_model.values())
                else:
                    if not isinstance(rel_model, (Manager, QuerySet, list)):
                        rel_model_fields = convert_model_to_json(rel_model, config_method=config_method)
                    else:
                        try:
                            rel_model_fields = [convert_model_to_json(model, config_method=config_method) for model in rel_model]
                        except TypeError:
                            rel_model_fields = [convert_model_to_json(model, config_method=config_method) for model in rel_model.all()]

#                print "rel_model_fields"
#                pprint(rel_model_fields)
                if rel_config.get('update'):
                    output.update(rel_model_fields)
                elif rel_name not in output:
                    output[rel_name] = rel_model_fields
                else:
                    output[rel_name].update(rel_model_fields)
#                continue
#
#                has_rel = hasattr(model, rel)
#                if not has_dot and has_rel:
#                    rel_model = getattr(model, rel)
#                    if not rel_has_own_config:
#                        rel_model_fields = extract_fields_from_model(rel_model, **rel_config) \
#                            if not isinstance(rel_model, (Manager, QuerySet)) else list(rel_model.values())
#                    else:
#                        if not isinstance(rel_model, (Manager, QuerySet)):
#                            rel_model_fields = convert_model_to_json(rel_model)
#                        else:
#                            try:
#                                rel_model_fields = [convert_model_to_json(model) for model in rel_model]
#                            except TypeError:
#                                rel_model_fields = [convert_model_to_json(model) for model in rel_model.all()]
#
#                    if rel.find('_ptr') >= 0:
#                        output.update(rel_model_fields)
#                    else:
#                        output[rel_config.get('name', rel)] = rel_model_fields
#                elif has_dot:
#                    path_list = rel.split('.')
#                    last_seg = path_list.pop()
#                    current_output = output
#                    current_model = model
#                    for seg in path_list:
##                        print 'Segment is "%s"' % seg
#                        current_model = getattr(current_model, seg, None)
#                        if current_model is None:
#                            current_output[seg] = None
#                            break
#                        elif seg.find('_ptr') < 0 and not rel_config.get('flat', False):
#                            current_output[seg] = {}
#                            current_output = current_output[seg]
#
#                    rel_model = getattr(current_model, last_seg, None)
#                    if rel_model and isinstance(rel_model, Model):
#                        rel_model_fields = extract_fields_from_model(rel_model, **rel_config)
#                    elif rel_model and isinstance(rel_model, (Manager, QuerySet)):
#                        rel_model_fields = list(rel_model.values())
#                    else:
#                        rel_model_fields = None
#
#                    if last_seg.find('_ptr') < 0 or rel_config.get('name', False):
#                        seg_name = rel_config.get('name', last_seg)
#                        if not current_output.get(seg_name):
#                            current_output[seg_name] = rel_model_fields
#                        else:
#                            current_output[seg_name].update(rel_model_fields)
#                    else:
#                        current_output.update(rel_model_fields)
#    print "final output"
#    pprint(output)
    return output or None


def extract_fields_from_model(model, retrieve_related_collections=False, **kwargs):
    if model is None: return model
    output_dict = {}

    get_id = kwargs['get_id'] if 'get_id' in kwargs else False
    related_to_string = kwargs.get('related_to_string')

    fields = model._meta.get_all_field_names() if kwargs.get('fields') is None or kwargs.get('fields') == '__all__' \
             else kwargs.get('fields')

    fields = difference(kwargs.get('exclude', []), fields)

    fields = fields + list(kwargs.get('include', []))

    for field in fields:
#        get_id = False
        if isinstance(getattr(model.__class__, field, None), ReverseSingleRelatedObjectDescriptor):
            is_related = True
#            print "%s is a foreign key" % field

        if not hasattr(model, field) and not get_id:
#            print "'%s' is not a member of the model" % field
            continue
        elif get_id and not hasattr(model, id_field):
            continue

        model_field = getattr(model, field) if hasattr(model, field) else None
        if not isinstance(model_field, (models.Model, Manager)):
#            print "Adding %s to output_dict[%s]" % (model_field, field)
            output_dict[field] = model_field
        else:
#            print "field %s is a Model or a Manager" % field
            if isinstance(model_field, Manager):
                if not retrieve_related_collections:
                    continue
                else:
#                        print 'retrieving related item "%s" and not converting to string' % field
                    try:
                        model_field_iter = iter(model_field)
                        output_dict[field] = [extract_fields_from_model(model) for model in model_field_iter]
                    except TypeError:
                        output_dict[field] = [extract_fields_from_model(model) for model in model_field.all()]
            else:
                output_dict[field] = unicode(model_field if model_field is not None else u'') if related_to_string else model_field.pk if model_field is not None else model_field
                if get_id:
#                    print 'attempting to set %s to %s' % (id_field, getattr(model, field+'_id', None))
                    output_dict[id_field] = getattr(model, id_field, None)

    return output_dict


def paginate(request, queryset, per_page=20):

    page = request.GET.get('page', '1')

    if page == 'all':
        per_page = queryset.__len__()

    paginator = Paginator(queryset, per_page, orphans=5) # Show 25 lots per page

    # Make sure page request is an int. If not, deliver first page.
    try:
        page_num = int(page)
    except ValueError:
        page_num = 1

    # If page request (9999) is out of range, deliver last page of results.
    try:
        objects = paginator.page(page_num)
    except (EmptyPage, InvalidPage):
        objects = paginator.page(paginator.num_pages)

    return objects


