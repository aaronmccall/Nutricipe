from decimal import Decimal
from django.core.exceptions import ValidationError
from django.conf import settings
from django.forms import DateInput, DateField, DecimalField
from django.forms.fields import CharField, IntegerField, BooleanField
from django.forms.forms import Form
from django.contrib.localflavor.us import forms as us_forms
from django.forms.widgets import Input, HiddenInput, TextInput, Textarea
from django.utils.safestring import mark_safe
from django.utils.translation import ugettext_lazy as _

class PercentInput(Input):
    """ A simple form input for a percentage """
    input_type = 'text'

    def _format_value(self, value):
        if value is None or value == '':
            return u''
        return str(Decimal(Decimal(value) * 100).quantize(Decimal('1.00'))) if Decimal(value) < 1 else value

    def render(self, name, value, attrs=None):
        return super(PercentInput, self).render(name, value, attrs) + mark_safe(u' %')

    def _has_changed(self, initial, data):
        return super(PercentInput, self)._has_changed(self._format_value(initial), data)

class PercentField(DecimalField):
    """ A field that gets a value between 0 and 1 and displays as a value between 0 and 100"""
    widget = PercentInput(attrs={"class": "percentInput", "size": 4})

    default_error_messages = {
        'positive': _(u'Must be a positive number.'),
    }

    def clean(self, value):
        """
        Validates that the input can be converted to a value between 0 and 1.
        Returns a Decimal
        """
        value = super(PercentField, self).clean(value)
        if value is None:
            return None
        if value < 0:
            raise ValidationError(self.error_messages['positive'])
        return Decimal("%.4f" % (value / Decimal('100.0')))
